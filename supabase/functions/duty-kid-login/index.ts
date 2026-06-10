// Duty kid login — server-side PIN verification + invisible kid auth users.
// Kids pick their face and enter a PIN; this function verifies the PIN
// against duty_profiles.pin (which is no longer readable by clients), lazily
// provisions a real auth user for the kid, and returns a session the client
// installs with supabase.auth.setSession(). All duty_* RLS is family-scoped
// for authenticated users, so the kid sees exactly their family's data.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const KID_EMAIL_DOMAIN = "kids.duty.internal";
const MAX_FAILURES = 5;          // per kid
const FAILURE_WINDOW_MIN = 10;   // minutes

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const action = body.action;
  const familyId = (body.family_id ?? "").trim();
  if (!familyId) return json({ error: "family_id required" }, 400);

  if (action === "list") {
    const [{ data: family }, { data: kids }] = await Promise.all([
      admin.from("duty_families").select("id, name").eq("id", familyId).maybeSingle(),
      admin.from("duty_profiles").select("id, full_name, avatar_color, avatar_url")
        .eq("family_id", familyId).eq("role", "kid").order("created_at"),
    ]);
    if (!family) return json({ error: "Family not found" }, 404);
    return json({ family_name: family.name, kids: kids ?? [] });
  }

  if (action === "login") {
    const kidId = (body.kid_id ?? "").trim();
    const pin = String(body.pin ?? "");
    if (!kidId || !/^\d{4}$/.test(pin)) return json({ error: "kid_id and 4-digit pin required" }, 400);

    // Rate limit: too many recent failures for this kid -> back off.
    const windowStart = new Date(Date.now() - FAILURE_WINDOW_MIN * 60_000).toISOString();
    const { count: failures } = await admin.from("duty_kid_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", kidId).eq("success", false).gte("attempted_at", windowStart);
    if ((failures ?? 0) >= MAX_FAILURES) {
      return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
    }

    const { data: kid } = await admin.from("duty_profiles")
      .select("id, full_name, role, family_id, avatar_color, avatar_url, pin, auth_user_id")
      .eq("id", kidId).eq("family_id", familyId).eq("role", "kid").maybeSingle();

    const ok = !!kid && !!kid.pin && kid.pin === pin;
    await admin.from("duty_kid_login_attempts").insert({ profile_id: kidId, success: ok });
    if (!ok) return json({ error: "Wrong PIN" }, 401);

    // Lazily provision the kid's invisible auth user.
    const email = `kid-${kid.id}@${KID_EMAIL_DOMAIN}`;
    const password = crypto.randomUUID() + crypto.randomUUID(); // rotated every login
    let authUserId = kid.auth_user_id as string | null;
    if (!authUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { app: "duty", duty_kid_profile: kid.id },
      });
      if (createErr || !created.user) return json({ error: `Could not provision login: ${createErr?.message}` }, 500);
      authUserId = created.user.id;
      await admin.from("duty_profiles").update({ auth_user_id: authUserId }).eq("id", kid.id);
    } else {
      const { error: pwErr } = await admin.auth.admin.updateUserById(authUserId, { password });
      if (pwErr) return json({ error: `Could not refresh login: ${pwErr.message}` }, 500);
    }

    // Mint a session server-side and hand it to the client.
    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signin, error: signinErr } = await anon.auth.signInWithPassword({ email, password });
    if (signinErr || !signin.session) return json({ error: `Sign-in failed: ${signinErr?.message}` }, 500);

    const { pin: _pin, ...safeKid } = kid as Record<string, unknown>;
    return json({
      session: { access_token: signin.session.access_token, refresh_token: signin.session.refresh_token },
      profile: safeKid,
    });
  }

  return json({ error: "Unknown action" }, 400);
});
