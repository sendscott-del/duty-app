// Duty — chore reminder push notifier.
//
// Triggered every minute by pg_cron. For every family whose
// `reminder_time` matches the current minute in the family's timezone,
// computes who has incomplete chores today and sends a Web Push:
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
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:scott@example.com"

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface DutyFamily {
  id: string
  name: string
  reminder_time: string
  reminder_timezone: string
  reminders_enabled: boolean
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
  endpoint: string
  p256dh: string
  auth: string
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

async function sendPush(sub: PushSub, payload: unknown, supa: ReturnType<typeof createClient>) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
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

Deno.serve(async (req: Request) => {
  const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: families, error: famErr } = await supa
    .from("duty_families")
    .select("id, name, reminder_time, reminder_timezone, reminders_enabled")
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

    // Cron fires every minute; only match the exact minute.
    if (now.hh !== rh || now.mm !== rm) continue

    // Pull everything we need for this family in parallel.
    const [{ data: chores }, { data: profiles }, { data: completions }, { data: subs }] = await Promise.all([
      supa.from("duty_chores").select("id, family_id, assigned_to, name, emoji, recurrence, recurrence_days, due_date").eq("family_id", f.id),
      supa.from("duty_profiles").select("id, family_id, full_name, role").eq("family_id", f.id),
      supa.from("duty_chore_completions").select("chore_id, completion_date, completed_by, status").eq("completion_date", now.dateStr),
      supa.from("duty_push_subscriptions").select("id, profile_id, endpoint, p256dh, auth").eq("family_id", f.id),
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
