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

  let body: { action?: string; device_id?: string; guardian_phone?: string; student_name?: string; school_name?: string; grade?: number };
  try { body = await req.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }
  if (!isUuid(body.device_id)) return json({ error: "기기 식별 정보가 올바르지 않습니다." }, 400);

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const userId = authData.user.id;
  const deviceId = body.device_id;

  if (body.action === "claim") {
    const metadata = authData.user.user_metadata || {};
    if (metadata.account_type === "guardian" && !authData.user.email_confirmed_at) {
      return json({ error: "무료 체험을 시작하려면 먼저 보호자 이메일 인증을 완료해 주세요." }, 403);
    }

    // 회원가입 직후에는 계정만 만들고, 자녀/보호자 정보는 별도 체험 등록 단계에서 저장한다.
    if (Object.prototype.hasOwnProperty.call(metadata, "guardian_phone")) {
      const { guardian_phone: _phone, ...safeMetadata } = metadata;
      const { error: metadataCleanupError } = await db.auth.admin.updateUserById(userId, { user_metadata: safeMetadata });
      if (metadataCleanupError) console.error("Guardian phone metadata cleanup failed:", metadataCleanupError);
    }

    const { error: sessionError } = await db.from("student_sessions").upsert(
      { user_id: userId, device_id: deviceId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (sessionError) return json({ error: "기기 로그인 등록에 실패했습니다." }, 500);

    const { data: existingProfile, error: profileError } = await db
      .from("member_profiles")
      .select("grade, display_name, school_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (profileError) return json({ error: "회원 정보를 확인하지 못했습니다." }, 500);

    let profile = existingProfile || null;
    if (!profile && metadata.account_type === "guardian" && metadata.grade) {
      const metadataGrade = Number(metadata.grade);
      if ([1, 2, 3, 4, 5, 6].includes(metadataGrade)) {
        const nextProfile = {
          user_id: userId,
          grade: metadataGrade,
          display_name: String(metadata.student_name || "").trim() || null,
          school_name: String(metadata.school_name || "").trim() || null,
          updated_at: new Date().toISOString(),
        };
        const { error: saveProfileError } = await db.from("member_profiles").upsert(nextProfile);
        if (saveProfileError) return json({ error: "회원 정보를 저장하지 못했습니다." }, 500);
        profile = nextProfile;
      }
    }

    const { data: subscription, error: subscriptionError } = await db
      .from("subscriptions")
      .select("is_trial, starts_at, ends_at, status, plan_months, payment_status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscriptionError) return json({ error: "이용권 상태를 확인하지 못했습니다." }, 500);

    return json({
      ok: true,
      needs_setup: metadata.account_type === "guardian" && !profile?.grade,
      profile: profile ? { grade: profile.grade, display_name: profile.display_name, school_name: profile.school_name } : null,
      subscription: subscription || null,
    });
  }

  if (body.action === "complete_trial") {
    const metadata = authData.user.user_metadata || {};
    if (metadata.account_type !== "guardian") return json({ error: "보호자 계정만 무료 체험을 등록할 수 있습니다." }, 403);
    if (!authData.user.email_confirmed_at) return json({ error: "이메일 인증을 먼저 완료해 주세요." }, 403);

    const phone = String(body.guardian_phone || "").replace(/[^0-9]/g, "");
    const studentName = String(body.student_name || "").trim();
    const schoolName = String(body.school_name || "").trim();
    const grade = Number(body.grade);
    if (!/^01[016789]\d{7,8}$/.test(phone)) return json({ error: "휴대폰 번호 형식이 올바르지 않습니다." }, 400);
    if (!studentName || studentName.length > 20) return json({ error: "자녀 이름을 1~20자로 입력해 주세요." }, 400);
    if (!schoolName || schoolName.length > 50) return json({ error: "학교 이름을 1~50자로 입력해 주세요." }, 400);
    if (![1, 2, 3, 4, 5, 6].includes(grade)) return json({ error: "학년을 다시 선택해 주세요." }, 400);

    const { error: stageError } = await db.rpc("stage_guardian_identity", {
      p_user_id: userId,
      p_email: authData.user.email,
      p_phone: phone,
    });
    if (stageError) {
      console.error("Guardian identity staging failed:", stageError);
      return json({ error: "보호자 정보를 안전하게 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
    }

    const { data: trial, error: trialError } = await db.rpc("claim_guardian_trial", { p_user_id: userId });
    if (trialError) {
      console.error("Guardian trial claim failed:", trialError);
      return json({ error: "무료 체험 등록을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
    }
    if (trial?.status === "duplicate_identity") {
      return json({
        error: "이 보호자 이메일 또는 휴대폰 번호로 무료 체험을 이미 이용한 이력이 있습니다. 기존 계정으로 로그인해 주세요.",
        code: "TRIAL_ALREADY_USED",
      }, 409);
    }
    if (!["trial_issued", "existing_trial", "existing_subscription"].includes(trial?.status)) {
      return json({ error: "무료 체험 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 500);
    }

    const nextProfile = {
      user_id: userId,
      grade,
      display_name: studentName,
      school_name: schoolName,
      updated_at: new Date().toISOString(),
    };
    const { error: saveProfileError } = await db.from("member_profiles").upsert(nextProfile);
    if (saveProfileError) return json({ error: "자녀 정보를 저장하지 못했습니다." }, 500);

    const { error: sessionError } = await db.from("student_sessions").upsert(
      { user_id: userId, device_id: deviceId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (sessionError) return json({ error: "기기 로그인 등록에 실패했습니다." }, 500);

    const { data: subscription, error: subscriptionError } = await db
      .from("subscriptions")
      .select("is_trial, starts_at, ends_at, status, plan_months, payment_status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscriptionError) return json({ error: "이용권 상태를 확인하지 못했습니다." }, 500);

    return json({
      ok: true,
      profile: { grade, display_name: studentName, school_name: schoolName },
      subscription: subscription || null,
      trial,
    });
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
