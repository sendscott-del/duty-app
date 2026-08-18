// Duty — chore reminder push notifier.
//
// Triggered every 5 minutes by pg_cron. For every family whose
// `reminder_time` has passed today (in the family's timezone) and that
// hasn't been reminded yet today, computes who has incomplete chores today
// and sends a Web Push:
//
//   - To each kid (on every device the kid has subscribed)
//     when that specific kid still has incomplete chores.
//   - To each parent (on every device the parent has subscribed)
//     with a one-line summary across the kids — only sent if at least
//     one kid still has incomplete chores.
//
// Skips silently if everyone in the family is already done for the day.

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
// Namespaced so Duty doesn't collide with Magnify/Glean's VAPID keypairs
// also living in this shared Supabase project.
const VAPID_PUBLIC_KEY = Deno.env.get("DUTY_VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("DUTY_VAPID_PRIVATE_KEY")!
const VAPID_SUBJECT = Deno.env.get("DUTY_VAPID_SUBJECT") || "mailto:sendscott@gmail.com"

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface DutyFamily {
  id: string
  name: string
  reminder_time: string
  reminder_timezone: string
  reminders_enabled: boolean
  last_reminded_on: string | null
}
interface DutyChore {
  id: string
  family_id: string
  assigned_to: string | null
  name: string
  emoji: string | null
  recurrence: "daily" | "weekly" | "monthly" | null
  recurrence_days: number[] | null
  due_date: string | null
}
interface DutyCompletion {
  chore_id: string
  completion_date: string
  completed_by: string
  status: "submitted" | "approved" | "rejected"
}
interface DutyProfile {
  id: string
  family_id: string
  full_name: string
  role: "parent" | "kid"
}
interface PushSub {
  id: string
  profile_id: string
  platform: "web" | "ios" | "android"
  endpoint: string | null
  p256dh: string | null
  auth: string | null
  device_token: string | null
}

function isDueToday(c: DutyChore, today: Date, todayStr: string): boolean {
  if (c.recurrence === "daily") return true
  if (c.recurrence === "weekly") {
    if (!c.recurrence_days || c.recurrence_days.length === 0) return true
    return c.recurrence_days.includes(today.getDay())
  }
  if (c.recurrence === "monthly") return true
  return c.due_date === todayStr || (!c.due_date && todayStr === todayStr)
}

// Get "now" in a given IANA timezone as { hour, minute, dateStr, weekday }.
function nowInZone(tz: string): { hh: number; mm: number; dateStr: string; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short",
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]))
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    hh: parseInt(parts.hour, 10),
    mm: parseInt(parts.minute, 10),
    dateStr,
    weekday: weekdayMap[parts.weekday] ?? 0,
  }
}

// ---------------------------------------------------------------------------
// APNs (native iOS App Store build)
//
// iOS exposes Web Push only to Home-Screen web apps, never inside the Capacitor
// WKWebView, so native devices register an APNs device token instead and we
// deliver to Apple directly. Team-scoped auth key, shared across Left Field apps.
// ---------------------------------------------------------------------------
const APNS_KEY_ID = Deno.env.get("DUTY_APNS_KEY_ID") ?? ""
const APNS_TEAM_ID = Deno.env.get("DUTY_APNS_TEAM_ID") ?? ""
const APNS_PRIVATE_KEY = Deno.env.get("DUTY_APNS_PRIVATE_KEY") ?? ""
const APNS_BUNDLE_ID = Deno.env.get("DUTY_APNS_BUNDLE_ID") ?? "com.leftfieldapps.duty"
// Production APNs. TestFlight/dev builds use api.sandbox.push.apple.com.
const APNS_HOST = Deno.env.get("DUTY_APNS_HOST") ?? "https://api.push.apple.com"

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

let apnsJwt: { token: string; at: number } | null = null

/** APNs provider token, cached ~50 min (Apple requires refresh between 20-60 min). */
async function apnsToken(): Promise<string | null> {
  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY) return null
  const now = Math.floor(Date.now() / 1000)
  if (apnsJwt && now - apnsJwt.at < 3000) return apnsJwt.token

  const pem = APNS_PRIVATE_KEY.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "")
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    "pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  )
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID })))
  const claims = b64url(new TextEncoder().encode(JSON.stringify({ iss: APNS_TEAM_ID, iat: now })))
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${header}.${claims}`)),
  )
  const token = `${header}.${claims}.${b64url(sig)}`
  apnsJwt = { token, at: now }
  return token
}

async function sendApns(sub: PushSub, payload: any, supa: ReturnType<typeof createClient>) {
  const jwt = await apnsToken()
  if (!jwt) return { ok: false, error: "APNs not configured" }

  const body = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: typeof payload.badge === "number" ? payload.badge : undefined,
    },
    url: payload.url,
    kind: payload.kind,
  }

  const res = await fetch(`${APNS_HOST}/3/device/${sub.device_token}`, {
    method: "POST",
    headers: {
      "authorization": `bearer ${jwt}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (res.ok) {
    await supa.from("duty_push_subscriptions").update({ last_pushed_at: new Date().toISOString() }).eq("id", sub.id)
    return { ok: true }
  }

  const text = await res.text().catch(() => "")
  // Apple says this token is dead -- garbage collect it like we do web endpoints.
  if (res.status === 410 || text.includes("BadDeviceToken") || text.includes("Unregistered")) {
    await supa.from("duty_push_subscriptions").delete().eq("id", sub.id)
  }
  return { ok: false, error: `APNs ${res.status} ${text.slice(0, 120)}` }
}

async function sendWebPush(sub: PushSub, payload: unknown, supa: ReturnType<typeof createClient>) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint!, keys: { p256dh: sub.p256dh!, auth: sub.auth! } },
      JSON.stringify(payload)
    )
    await supa.from("duty_push_subscriptions").update({ last_pushed_at: new Date().toISOString() }).eq("id", sub.id)
    return { ok: true }
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    // 404/410 = endpoint is dead. Garbage collect.
    if (status === 404 || status === 410) {
      await supa.from("duty_push_subscriptions").delete().eq("id", sub.id)
    }
    return { ok: false, error: String(err) }
  }
}

/** Route each subscription to the right transport. */
async function sendPush(sub: PushSub, payload: unknown, supa: ReturnType<typeof createClient>) {
  if (sub.platform === "ios" || sub.platform === "android") return await sendApns(sub, payload, supa)
  return await sendWebPush(sub, payload, supa)
}

Deno.serve(async (req: Request) => {
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: families, error: famErr } = await supa
    .from("duty_families")
    .select("id, name, reminder_time, reminder_timezone, reminders_enabled, last_reminded_on")
    .eq("reminders_enabled", true)

  if (famErr) {
    return new Response(JSON.stringify({ ok: false, error: famErr.message }), { status: 500 })
  }

  const summary: Array<Record<string, unknown>> = []

  for (const f of (families ?? []) as DutyFamily[]) {
    const tz = f.reminder_timezone || "America/Chicago"
    const now = nowInZone(tz)

    // Parse HH:MM[:SS] -> hh, mm
    const [rh, rm] = (f.reminder_time || "18:00").split(":").map((n) => parseInt(n, 10))

    // Fire once per day, at or after the family's reminder time in their tz.
    // The cron used to run every minute and this matched the exact minute; it
    // now runs every 5 minutes (to cut its share of Supabase Disk IO), so we
    // match a "reminder time has passed today" window instead of one minute,
    // and dedupe with last_reminded_on so a reminder never double-sends and a
    // missed/late cron run just delays it to the next run instead of skipping
    // the day. (A reminder set in the last few minutes before midnight may be
    // missed — no cron run lands between it and the date rollover; acceptable
    // for chore nudges.)
    const reminderMinutes = rh * 60 + rm
    const nowMinutes = now.hh * 60 + now.mm
    if (nowMinutes < reminderMinutes) continue        // not time yet today
    if (f.last_reminded_on === now.dateStr) continue  // already handled today

    // Claim today's reminder up front (single tiny write per family per day)
    // so an overlapping/retried run doesn't double-send and so all-done
    // families aren't re-evaluated on every run for the rest of the day.
    await supa.from("duty_families").update({ last_reminded_on: now.dateStr }).eq("id", f.id)

    // Pull everything we need for this family in parallel.
    const [{ data: chores }, { data: profiles }, { data: completions }, { data: subs }] = await Promise.all([
      supa.from("duty_chores").select("id, family_id, assigned_to, name, emoji, recurrence, recurrence_days, due_date").eq("family_id", f.id),
      supa.from("duty_profiles").select("id, family_id, full_name, role").eq("family_id", f.id),
      supa.from("duty_chore_completions").select("chore_id, completion_date, completed_by, status").eq("completion_date", now.dateStr),
      supa.from("duty_push_subscriptions").select("id, profile_id, platform, endpoint, p256dh, auth, device_token").eq("family_id", f.id),
    ])

    const allChores = (chores ?? []) as DutyChore[]
    const allProfiles = (profiles ?? []) as DutyProfile[]
    const allCompletions = (completions ?? []) as DutyCompletion[]
    const allSubs = (subs ?? []) as PushSub[]

    // Which (chore, kid) pairs are still open today?
    // "Done for the day" = a completion exists with status in (submitted, approved).
    // Rejected counts as not done.
    const today = new Date()
    const incompleteByKid = new Map<string, DutyChore[]>()

    for (const chore of allChores) {
      if (!chore.assigned_to) continue
      if (!isDueToday(chore, today, now.dateStr)) continue
      const done = allCompletions.some(
        (c) => c.chore_id === chore.id
          && c.completed_by === chore.assigned_to
          && (c.status === "submitted" || c.status === "approved")
      )
      if (done) continue
      const arr = incompleteByKid.get(chore.assigned_to) ?? []
      arr.push(chore)
      incompleteByKid.set(chore.assigned_to, arr)
    }

    const totalIncomplete = Array.from(incompleteByKid.values()).reduce((s, arr) => s + arr.length, 0)
    if (totalIncomplete === 0) {
      summary.push({ family_id: f.id, sent: 0, reason: "all_done" })
      continue
    }

    // 1) Kid notifications — one per subscribed device of the kid.
    let sent = 0
    for (const [kidId, openChores] of incompleteByKid.entries()) {
      const kidSubs = allSubs.filter((s) => s.profile_id === kidId)
      if (kidSubs.length === 0) continue
      const n = openChores.length
      const payload = {
        kind: "kid_reminder",
        title: "🚽 Chores left!",
        body: n === 1
          ? `You've got 1 chore to flush — tap to crush it.`
          : `You've got ${n} chores to flush — tap to crush 'em.`,
        url: "/kid",
        badge: n,
      }
      for (const sub of kidSubs) {
        const res = await sendPush(sub, payload, supa)
        if (res.ok) sent++
      }
    }

    // 2) Parent notifications — summary across kids.
    const parents = allProfiles.filter((p) => p.role === "parent")
    const parentSubs = allSubs.filter((s) => parents.some((p) => p.id === s.profile_id))
    if (parentSubs.length > 0) {
      const kidMap = new Map(allProfiles.filter(p => p.role === "kid").map((k) => [k.id, k]))
      const parts: string[] = []
      for (const [kidId, openChores] of incompleteByKid.entries()) {
        const kid = kidMap.get(kidId)
        const firstName = (kid?.full_name ?? "Kid").split(" ")[0]
        parts.push(`${firstName}: ${openChores.length}`)
      }
      const payload = {
        kind: "parent_summary",
        title: "Chore check-in",
        body: parts.join(" · "),
        url: "/parent/overview",
        badge: totalIncomplete,
      }
      for (const sub of parentSubs) {
        const res = await sendPush(sub, payload, supa)
        if (res.ok) sent++
      }
    }

    summary.push({ family_id: f.id, sent, incomplete_kids: incompleteByKid.size, total_incomplete: totalIncomplete })
  }

  return new Response(JSON.stringify({ ok: true, results: summary }), {
    headers: { "Content-Type": "application/json" },
  })
})
