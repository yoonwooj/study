import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST 요청만 허용됩니다." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || !anonKey) return json({ error: "로그인이 필요합니다." }, 401);

  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "로그인 세션이 유효하지 않습니다." }, 401);

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: admin, error: adminError } = await db.from("admin_users").select("role").eq("user_id", authData.user.id).maybeSingle();
  if (adminError || !admin) return json({ error: "관리자 권한이 없습니다." }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }

  if (body.action === "list") {
    const { data: authUsers, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return json({ error: usersError.message }, 500);
    const ids = authUsers.users.map((u) => u.id);
    const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
      db.from("member_profiles").select("user_id,display_name,grade,is_test,created_at").in("user_id", ids),
      db.from("subscriptions").select("id,user_id,plan_months,is_trial,starts_at,ends_at,status,payment_status,amount_krw,memo,created_at").in("user_id", ids).order("created_at", { ascending: false }),
    ]);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const subMap = new Map<string, any>();
    for (const s of subscriptions || []) if (!subMap.has(s.user_id)) subMap.set(s.user_id, s);
    const members = authUsers.users.map((u) => ({
      id: u.id, email: u.email, phone: u.phone,
      created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
      email_confirmed: !!u.email_confirmed_at,
      profile: profileMap.get(u.id) || null,
      subscription: subMap.get(u.id) || null,
      is_test: !!profileMap.get(u.id)?.is_test,
    }));
    const now = Date.now();
    const active = members.filter((m) => m.subscription?.status === "active" && new Date(m.subscription.ends_at).getTime() >= now).length;
    return json({ members, summary: { total: members.length, active, expired: members.filter((m) => m.subscription && new Date(m.subscription.ends_at).getTime() < now).length, no_subscription: members.filter((m) => !m.subscription).length } });
  }


  if (body.action === "create_test_user") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const display_name = String(body.display_name || "").trim();
    const grade = Number(body.grade);
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return json({ error: "올바른 이메일 주소를 입력해 주세요." }, 400);
    if (password.length < 8) return json({ error: "비밀번호는 8자 이상이어야 합니다." }, 400);
    if (![1,2,3,4,5,6].includes(grade)) return json({ error: "학년을 선택해 주세요." }, 400);
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { is_test_account: true, display_name, grade },
    });
    if (createError || !created.user) return json({ error: createError?.message || "테스트 계정을 생성하지 못했습니다." }, 400);
    const userId = created.user.id;
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 12);
    const { error: profileError } = await db.from("member_profiles").upsert({
      user_id: userId, display_name: display_name || null, grade, is_test: true, updated_at: now.toISOString(),
    });
    if (profileError) {
      await db.auth.admin.deleteUser(userId);
      return json({ error: "테스트 계정 프로필 저장 실패: " + profileError.message }, 500);
    }
    const { error: subscriptionError } = await db.from("subscriptions").insert({
      user_id: userId, plan_months: 12, is_trial: false,
      starts_at: now.toISOString(), ends_at: end.toISOString(),
      status: "active", payment_status: "manual", amount_krw: 0,
      memo: "관리자 페이지에서 생성한 테스트 계정",
    });
    if (subscriptionError) {
      await db.from("member_profiles").delete().eq("user_id", userId);
      await db.auth.admin.deleteUser(userId);
      return json({ error: "테스트 계정 이용권 생성 실패: " + subscriptionError.message }, 500);
    }
    return json({ user: { id: userId, email, display_name, grade }, message: "테스트 계정이 생성되었습니다." });
  }

  if (body.action === "save_subscription") {
    const { user_id, plan_months, is_trial, starts_at, status, payment_status, amount_krw, memo } = body;
    if (typeof user_id !== "string" || (!is_trial && ![3, 6, 12].includes(Number(plan_months)))) return json({ error: "회원 또는 구독 기간 값이 올바르지 않습니다." }, 400);
    if (!["active", "paused", "canceled"].includes(status || "active")) return json({ error: "구독 상태가 올바르지 않습니다." }, 400);
    if (!["paid", "pending", "refunded", "manual"].includes(payment_status || "manual")) return json({ error: "결제 상태가 올바르지 않습니다." }, 400);
    const start = starts_at ? new Date(starts_at) : new Date();
    if (Number.isNaN(start.getTime())) return json({ error: "시작일이 올바르지 않습니다." }, 400);
    const end = new Date(start);
    if (is_trial) end.setDate(end.getDate() + 14);
    else end.setMonth(end.getMonth() + Number(plan_months));
    const payload = { user_id, plan_months: Number(plan_months), is_trial: !!is_trial, starts_at: start.toISOString(), ends_at: end.toISOString(), status: status || "active", payment_status: payment_status || "manual", amount_krw: amount_krw === "" || amount_krw == null ? null : Number(amount_krw), memo: memo || null, updated_at: new Date().toISOString() };
    if (payload.amount_krw !== null && (!Number.isInteger(payload.amount_krw) || payload.amount_krw < 0)) return json({ error: "결제 금액은 0 이상의 정수여야 합니다." }, 400);
    const { data, error } = await db.from("subscriptions").insert(payload).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ subscription: data });
  }

  if (body.action === "update_profile") {
    const { user_id, display_name, grade } = body;
    if (typeof user_id !== "string" || (grade !== null && grade !== "" && ![1,2,3,4,5,6].includes(Number(grade)))) return json({ error: "회원 정보가 올바르지 않습니다." }, 400);
    const { data, error } = await db.from("member_profiles").upsert({ user_id, display_name: display_name || null, grade: grade === "" || grade == null ? null : Number(grade), updated_at: new Date().toISOString() }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ profile: data });
  }

  return json({ error: "지원하지 않는 작업입니다." }, 400);
});
