import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST 요청만 허용됩니다." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ error: "서버 인증 설정이 없습니다." }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "로그인이 필요합니다." }, 401);

  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "로그인 세션이 유효하지 않습니다." }, 401);

  let body: { action?: string; device_id?: string };
  try { body = await req.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }
  if (!isUuid(body.device_id)) return json({ error: "기기 식별 정보가 올바르지 않습니다." }, 400);

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const userId = authData.user.id;
  const deviceId = body.device_id;

  if (body.action === "claim") {
    const { error } = await db.from("student_sessions").upsert(
      { user_id: userId, device_id: deviceId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) return json({ error: "기기 로그인 등록에 실패했습니다." }, 500);

    const { data: existingProfile, error: profileError } = await db
      .from("member_profiles")
      .select("grade, display_name, school_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) return json({ error: "회원 정보를 확인하지 못했습니다." }, 500);

    const metadata = authData.user.user_metadata || {};
    const metadataGrade = Number(metadata.grade);
    const grade = existingProfile?.grade ?? ([1, 2, 3, 4, 5, 6].includes(metadataGrade) ? metadataGrade : null);
    const profile = {
      user_id: userId,
      grade,
      display_name: existingProfile?.display_name || String(metadata.student_name || "").trim() || null,
      school_name: existingProfile?.school_name || String(metadata.school_name || "").trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: saveProfileError } = await db.from("member_profiles").upsert(profile);
    if (saveProfileError) return json({ error: "회원 정보를 저장하지 못했습니다." }, 500);
    return json({ ok: true, profile: { grade, display_name: profile.display_name, school_name: profile.school_name } });
  }

  if (body.action === "check") {
    const { data, error } = await db.from("student_sessions").select("device_id").eq("user_id", userId).maybeSingle();
    if (error) return json({ error: "로그인 상태 확인에 실패했습니다." }, 500);
    return json({ active: !!data && data.device_id === deviceId });
  }

  if (body.action === "release") {
    const { error } = await db.from("student_sessions").delete().eq("user_id", userId).eq("device_id", deviceId);
    if (error) return json({ error: "로그아웃 처리에 실패했습니다." }, 500);
    return json({ ok: true });
  }

  return json({ error: "지원하지 않는 작업입니다." }, 400);
});
