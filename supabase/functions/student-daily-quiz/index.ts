import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { BANK } from "https://raw.githubusercontent.com/yoonwooj/study/a1bfd143648da8d7e584968c1dab03b3ce55e9f0/supabase/functions/student-daily-quiz/bank/index.js";
import { CUR } from "https://raw.githubusercontent.com/yoonwooj/study/a1bfd143648da8d7e584968c1dab03b3ce55e9f0/supabase/functions/student-daily-quiz/curriculum.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const seededShuffle = <T>(arr: T[], seed: number): T[] => {
  const random = rng(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const shuffle = <T>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const seoulDate = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
const dayNumber = () => Math.floor(Date.parse(seoulDate() + "T00:00:00+09:00") / 86400000);
const normalize = (value: unknown) => String(value ?? "").replace(/[\s.,!?]/g, "").toLowerCase();

type BankQuestion = { t: "c" | "ox" | "s"; q: string; o?: string[]; a: number | boolean | string[]; e?: string };
type PoolItem = { q: BankQuestion; unit: string; ctx: { subj: string; g: number; s: number } };

const pool = (subj: string, grade: number, semester: number | null, unitName: string): PoolItem[] => {
  const out: PoolItem[] = [];
  const semesters = semester ? [semester] : [1, 2];
  for (const s of semesters) {
    const units = CUR[subj]?.[grade]?.[s] || [];
    units.forEach((unit: string, index: number) => {
      const questions = BANK[`${subj}-${grade}-${s}-${index}`] || [];
      questions.forEach((q: BankQuestion) => out.push({ q, unit, ctx: { subj, g: grade, s } }));
    });
  }
  if (!unitName) return out;
  const matched = out.filter((item) => item.unit && item.unit.includes(unitName));
  return matched.length ? matched : out;
};

const buildDailyQuestions = (grade: number, semester: number | null, subjectName: string, unitName: string) => {
  const subjectCode = ({
    "국어": "kor", "통합": "mor", "바른생활": "mor",
    "사회": "soc", "과학": "sci",
  } as Record<string, string>)[subjectName];
  if (!subjectCode) throw new Error("선택한 과목을 확인해 주세요.");
  const day = dayNumber();
  let picks: PoolItem[] = [];
  if (CUR[subjectCode]?.[grade]) {
    const list = seededShuffle(pool(subjectCode, grade, semester, unitName), grade * 1000 + subjectCode.length + (semester || 0) * 100);
    if (!list.length) throw new Error("선택한 과목의 문제가 아직 준비되지 않았어요.");
    picks = Array.from({ length: Math.min(20, list.length) }, (_, i) => list[(day * 20 + i) % list.length]);
    picks = seededShuffle(picks, day * 7 + grade + subjectCode.length + (semester || 0));
  } else {
    const half = 10;
    picks = ["kor", "mor"].flatMap((subject, index) => {
      const list = seededShuffle(pool(subject, grade, semester, unitName), grade * 1000 + index + (semester || 0) * 100);
      if (!list.length) return [];
      return Array.from({ length: Math.min(half, list.length) }, (_, i) => list[(day * half + i) % list.length]);
    });
    picks = seededShuffle(picks, day * 7 + grade + (semester || 0));
  }
  if (!picks.length) throw new Error("오늘 제공할 문제가 없습니다.");
  return picks.map((item) => {
    const source = structuredClone(item.q);
    let options = source.o || [];
    let answer = source.a;
    if (source.t === "c") {
      const shuffled = shuffle(options.map((text, index) => ({ text, correct: index === Number(answer) })));
      options = shuffled.map((entry) => entry.text);
      answer = shuffled.findIndex((entry) => entry.correct);
    }
    return {
      id: crypto.randomUUID(),
      t: source.t,
      q: source.q,
      o: options,
      a: answer,
      e: source.e || "",
      unit: item.unit,
      _ctx: item.ctx,
    };
  });
};

const publicQuestion = (q: any) => ({
  id: q.id, t: q.t, q: q.q, o: q.o, unit: q.unit, _ctx: q._ctx,
});

const answerText = (q: any) => {
  if (q.t === "c") return `${["①", "②", "③", "④"][Number(q.a)] || ""} ${q.o?.[Number(q.a)] || ""}`.trim();
  if (q.t === "ox") return q.a ? "O" : "X";
  return Array.isArray(q.a) ? String(q.a[0] ?? "") : String(q.a ?? "");
};

Deno.serve(async (req: Request) => {
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

  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const now = new Date();
  const { data: subscription, error: subscriptionError } = await db
    .from("subscriptions").select("id").eq("user_id", authData.user.id)
    .eq("status", "active").lte("starts_at", now.toISOString())
    .gte("ends_at", now.toISOString()).order("ends_at", { ascending: false }).limit(1).maybeSingle();
  if (subscriptionError) return json({ error: "이용권 확인에 실패했습니다." }, 500);
  if (!subscription) return json({ error: "유효한 이용권이 없습니다. 관리자에게 이용권 등록을 요청해 주세요." }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }

  if (body.action === "start") {
    const grade = Number(body.grade);
    const semester = body.semester == null || body.semester === "" ? null : Number(body.semester);
    const subject = String(body.subject || "");
    const unitName = String(body.unitName || "");
    if (![1, 2, 3, 4, 5, 6].includes(grade)) return json({ error: "학년 값이 올바르지 않습니다." }, 400);
    if (semester !== null && ![1, 2].includes(semester)) return json({ error: "학기 값이 올바르지 않습니다." }, 400);
    let questions: any[];
    try { questions = buildDailyQuestions(grade, semester, subject, unitName); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "문제를 준비하지 못했습니다." }, 400); }
    const { data: session, error: sessionError } = await db.from("student_quiz_sessions").insert({
      user_id: authData.user.id,
      grade,
      semester,
      subject,
      questions,
      current_index: 0,
      expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    }).select("id").single();
    if (sessionError || !session) return json({ error: "학습 세션을 생성하지 못했습니다." }, 500);
    return json({ session_id: session.id, questions: questions.map(publicQuestion) });
  }

  if (body.action === "submit") {
    const sessionId = String(body.session_id || "");
    const index = Number(body.question_index);
    if (!sessionId || !Number.isInteger(index) || index < 0) return json({ error: "답안 요청 정보가 올바르지 않습니다." }, 400);
    const { data: session, error: sessionError } = await db.from("student_quiz_sessions")
      .select("id,questions,current_index,expires_at")
      .eq("id", sessionId).eq("user_id", authData.user.id)
      .gt("expires_at", now.toISOString()).maybeSingle();
    if (sessionError) return json({ error: "학습 세션을 확인하지 못했습니다." }, 500);
    if (!session) return json({ error: "학습 세션이 만료되었거나 존재하지 않습니다." }, 404);
    if (session.current_index !== index) return json({ error: "이미 제출했거나 순서가 올바르지 않은 답안입니다." }, 409);
    const q = (session.questions as any[])[index];
    if (!q) return json({ error: "문제를 찾을 수 없습니다." }, 404);

    let correct = false;
    if (q.t === "c" || q.t === "ox") correct = body.answer === q.a;
    else if (q.t === "s") {
      const accepted = Array.isArray(q.a) ? q.a : [q.a];
      correct = accepted.some((value: unknown) => normalize(value) === normalize(body.answer));
    }
    const { data: advanced, error: advanceError } = await db.from("student_quiz_sessions")
      .update({ current_index: index + 1 })
      .eq("id", sessionId).eq("user_id", authData.user.id).eq("current_index", index)
      .select("id").maybeSingle();
    if (advanceError) return json({ error: "답안 처리에 실패했습니다." }, 500);
    if (!advanced) return json({ error: "이미 제출한 답안입니다. 다음 문제로 이동해 주세요." }, 409);

    return json({
      is_correct: correct,
      correct_answer_value: q.a,
      correct_answer_index: q.t === "c" ? Number(q.a) : null,
      correct_answer_text: answerText(q),
      explanation: q.e || "",
      next_index: index + 1,
    });
  }

  return json({ error: "지원하지 않는 작업입니다." }, 400);
});
