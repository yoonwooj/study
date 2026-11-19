const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...CORS_HEADERS } });
}
function seoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}
function normalize(value) {
  return String(value ?? "").replace(/[\s.,!?]/g, "").toLowerCase();
}
function shuffle(values) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function answerText(q) {
  if (q.t === "c") return `${["①", "②", "③", "④"][Number(q.a)] || ""} ${q.o?.[Number(q.a)] || ""}`.trim();
  if (q.t === "ox") return q.a ? "O" : "X";
  return Array.isArray(q.a) ? String(q.a[0] ?? "") : String(q.a ?? "");
}
function envCheck(env) {
  for (const key of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!env[key]) throw new Error(`Cloudflare Worker Secret ${key}가 등록되지 않았습니다.`);
  }
}
async function supabase(env, path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(`Supabase 오류(${response.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`);
  return data;
}
async function authenticate(request, env) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return response.json();
}
async function checkSubscription(userId, env) {
  const now = encodeURIComponent(new Date().toISOString());
  const rows = await supabase(env,
    `subscriptions?select=id&user_id=eq.${encodeURIComponent(userId)}&status=eq.active&starts_at=lte.${now}&ends_at=gte.${now}&limit=1`);
  return Array.isArray(rows) && rows.length > 0;
}

async function startQuiz(body, user, env) {
  const grade = Number(body.grade);
  const semester = body.semester == null || body.semester === "" ? null : Number(body.semester);
  const requestedSubject = String(body.subject || "").trim();
  const subject = requestedSubject === "바른생활" ? "통합" : requestedSubject;
  const unitName = String(body.unitName || "").trim();
  if (![1, 2, 3, 4, 5, 6].includes(grade)) return json({ error: "학년 값이 올바르지 않습니다." }, 400);
  if (semester !== null && ![1, 2].includes(semester)) return json({ error: "학기 값이 올바르지 않습니다." }, 400);
  if (!subject) return json({ error: "과목을 선택해 주세요." }, 400);

  const targetRows = await supabase(env, "unit_daily_targets?select=unit_id&is_active=eq.true");
  const targetIds = [...new Set((targetRows || []).map((row) => row.unit_id))];
  if (!targetIds.length) return json({ error: "현재 배포 대상으로 지정된 단원이 없습니다." }, 404);
  const unitFilters = [
    "select=id,grade,semester,subject,publisher,unit_number,unit_name",
    `id=in.(${targetIds.join(",")})`,
    `grade=eq.${grade}`,
    `subject=eq.${encodeURIComponent(subject)}`,
  ];
  if (semester !== null) unitFilters.push(`semester=eq.${semester}`);
  const allUnits = await supabase(env, `textbook_units?${unitFilters.join("&")}`);
  const units = (allUnits || []).filter((unit) => !["TEST-SEED", "테스트용(임시)"].includes(unit.publisher));
  if (!units?.length) return json({ error: `${grade}학년 ${semester ? semester + "학기 " : ""}${subject} 과목은 아직 검증된 문제 배포 단원이 준비되지 않았습니다.` }, 404);

  let selectedUnits = units;
  if (unitName) {
    const matching = units.filter((unit) => unit.unit_name.includes(unitName));
    if (matching.length) selectedUnits = matching;
  }
  const unitIds = selectedUnits.map((unit) => unit.id);
  const runs = await supabase(env,
    "generation_runs?select=id,generation_date,status&status=in.(completed,partial)&order=generation_date.desc,created_at.desc&limit=7");
  let pool = [];
  for (const run of runs || []) {
    const rows = await supabase(env,
      `questions?select=id,unit_id,question,options,answer,explanation,difficulty&generation_run_id=eq.${run.id}&unit_id=in.(${unitIds.join(",")})&limit=500`);
    if (rows?.length) { pool = rows; break; }
  }
  const valid = (pool || []).filter((row) =>
    typeof row.question === "string" && Array.isArray(row.options) &&
    row.options.length === 4 && row.options.includes(row.answer));
  if (valid.length < 20) {
    return json({ error: `현재 ${grade}학년 ${subject}에 배포된 문제가 ${valid.length}개입니다. 20문제 세트가 준비되면 학습할 수 있습니다.` }, 409);
  }

  const picked = shuffle(valid).slice(0, 20).map((row) => {
    const options = shuffle(row.options);
    return {
      id: String(row.id),
      t: "c",
      q: row.question,
      o: options,
      a: options.indexOf(row.answer),
      e: row.explanation || "",
      unit: selectedUnits.find((unit) => unit.id === row.unit_id)?.unit_name || "",
      _ctx: { subj: subject, g: grade, s: semester || selectedUnits.find((unit) => unit.id === row.unit_id)?.semester || 1 },
    };
  });
  const inserted = await supabase(env, "student_quiz_sessions?select=id", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({
      user_id: user.id, grade, semester, subject, questions: picked,
      current_index: 0, expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    }),
  });
  const session = Array.isArray(inserted) ? inserted[0] : null;
  if (!session?.id) return json({ error: "학습 세션을 만들지 못했습니다." }, 500);
  return json({
    session_id: session.id,
    questions: picked.map(({ a, e, ...question }) => question),
  });
}

async function submitAnswer(body, user, env) {
  const sessionId = String(body.session_id || "");
  const index = Number(body.question_index);
  if (!sessionId || !Number.isInteger(index) || index < 0) return json({ error: "답안 요청 정보가 올바르지 않습니다." }, 400);
  const rows = await supabase(env,
    `student_quiz_sessions?select=id,questions,current_index,expires_at& id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(user.id)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`.replace("& id=", "&id="));
  const session = rows?.[0];
  if (!session) return json({ error: "학습 세션이 만료되었거나 존재하지 않습니다." }, 404);
  if (session.current_index !== index) return json({ error: "이미 제출했거나 순서가 올바르지 않은 답안입니다." }, 409);
  const q = session.questions?.[index];
  if (!q) return json({ error: "문제를 찾을 수 없습니다." }, 404);
  const correct = q.t === "s"
    ? (Array.isArray(q.a) ? q.a : [q.a]).some((value) => normalize(value) === normalize(body.answer))
    : body.answer === q.a;
  const updated = await supabase(env,
    `student_quiz_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(user.id)}&current_index=eq.${index}`, {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ current_index: index + 1 }),
    });
  if (!updated?.length) return json({ error: "이미 제출한 답안입니다. 다음 문제로 이동해 주세요." }, 409);
  return json({
    is_correct: correct,
    correct_answer_value: q.a,
    correct_answer_index: q.t === "c" ? Number(q.a) : null,
    correct_answer_text: answerText(q),
    explanation: q.e || "",
    next_index: index + 1,
  });
}

function outputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output || []) for (const part of item.content || []) {
    if (part.type === "output_text" && typeof part.text === "string") return part.text;
  }
  throw new Error("OpenAI 응답에서 문제 JSON을 찾지 못했습니다.");
}
async function createQuestions(unit, env) {
  if (!env.OPENAI_API_KEY) throw new Error("Cloudflare Worker Secret OPENAI_API_KEY가 등록되지 않았습니다.");
  const schema = {
    type: "object", additionalProperties: false,
    properties: { questions: { type: "array", items: {
      type: "object", additionalProperties: false,
      properties: {
        question: { type: "string" },
        options: { type: "array", items: { type: "string" } },
        answer: { type: "string" },
        explanation: { type: "string" },
        difficulty: { type: "string", enum: ["쉬움", "보통", "어려움"] },
      },
      required: ["question", "options", "answer", "explanation", "difficulty"],
    } } },
    required: ["questions"],
  };
  const prompt = `너는 대한민국 초등학교 교육과정에 맞춰 평가 문항을 만드는 교사다.
정확히 20개의 서로 다른 4지선다 객관식 문제를 작성한다.
학년 수준에 맞는 짧고 명확한 문장을 사용하고, 정답은 보기 중 하나와 글자까지 정확히 일치시킨다.
각 문제의 해설은 어린이가 이해하기 쉽게 한두 문장으로 설명한다.
난이도는 쉬움 7개, 보통 8개, 어려움 5개를 목표로 배분한다.
문제 간 같은 개념·상황·정답 패턴을 반복하지 않는다.
아래 교과서 단원명, 확인된 학습 정보, 출처 메모만 출제 범위의 근거로 사용한다.
출처에 없는 차시, 지역명, 인물, 연도, 통계, 구체 사실을 만들어내지 않는다.
세부 정보가 확인되지 않은 단원은 단원명에서 직접 도출되는 기초 개념과 일상 상황을 중심으로 출제한다.
학년: ${unit.grade}학년
학기: ${unit.semester}학기
과목: ${unit.subject}
출판사: ${unit.publisher}
단원: ${unit.unit_number}. ${unit.unit_name}
검증 상태: ${unit.verification_status || "미기재"}
확인된 학습 정보: ${unit.learning_goal || "세부 학습 정보 미확인"}
출처 메모: ${unit.source_note || "추가 출처 메모 없음"}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4o-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      text: { format: { type: "json_schema", name: "daily_questions", strict: true, schema } },
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`OpenAI API 오류(${response.status}): ${JSON.stringify(payload).slice(0, 350)}`);
  const parsed = JSON.parse(outputText(payload));
  const questions = (parsed.questions || []).filter((q) =>
    typeof q.question === "string" && q.question.trim() &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every((option) => typeof option === "string" && option.trim()) &&
    new Set(q.options).size === 4 && q.options.includes(q.answer) &&
    typeof q.explanation === "string" && q.explanation.trim() &&
    ["쉬움", "보통", "어려움"].includes(q.difficulty));
  const unique = [...new Map(questions.map((q) => [q.question.trim(), q])).values()];
  if (unique.length !== 20) throw new Error(`문제 검증 실패: 20개 요청, ${unique.length}개 유효`);
  return unique;
}

async function generateDaily(env) {
  envCheck(env);
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY Secret이 없습니다.");
  const date = seoulDate();
  const existingRows = await supabase(env, `generation_runs?select=id,status,started_at&generation_date=eq.${date}&limit=1`);
  let run = existingRows?.[0];
  if (run?.status === "completed") return { status: "already_completed", generation_date: date };
  if (run?.status === "running" && run.started_at && Date.now() - Date.parse(run.started_at) < 20 * 60 * 1000) {
    return { status: "already_running", generation_date: date };
  }

  const targets = await supabase(env, "unit_daily_targets?select=unit_id&is_active=eq.true");
  const ids = [...new Set((targets || []).map((target) => target.unit_id))];
  if (!ids.length) return { status: "skipped", reason: "no_active_targets", generation_date: date };
  const allUnits = await supabase(env,
    `textbook_units?select=id,grade,semester,subject,publisher,unit_number,unit_name,learning_goal,verification_status,source_note&id=in.(${ids.join(",")})&order=grade.asc,semester.asc,subject.asc,unit_number.asc`);
  const units = (allUnits || []).filter((unit) => !["TEST-SEED", "테스트용(임시)"].includes(unit.publisher));
  if (!units.length) return { status: "skipped", reason: "no_verified_units", generation_date: date };

  if (run?.id) {
    await supabase(env, `questions?generation_run_id=eq.${run.id}`, { method: "DELETE" });
    await supabase(env, `generation_runs?id=eq.${run.id}`, {
      method: "PATCH", body: JSON.stringify({
        status: "running", requested_count: units.length * 20, generated_count: 0,
        error_message: null, started_at: new Date().toISOString(), finished_at: null,
      }),
    });
  } else {
    const created = await supabase(env, "generation_runs?select=id", {
      method: "POST", headers: { prefer: "return=representation" },
      body: JSON.stringify({
        generation_date: date, status: "running", requested_count: units.length * 20,
        generated_count: 0, started_at: new Date().toISOString(),
      }),
    });
    run = created?.[0];
  }
  if (!run?.id) throw new Error("문제 생성 실행 기록을 만들지 못했습니다.");

  let generated = 0;
  const errors = [];
  for (let offset = 0; offset < units.length; offset += 3) {
    const batch = units.slice(offset, offset + 3);
    const results = await Promise.all(batch.map(async (unit) => {
      try {
        const questions = await createQuestions(unit, env);
        const rows = questions.map((q) => ({
          unit_id: unit.id, question: q.question, question_type: "객관식",
          options: q.options, answer: q.answer, explanation: q.explanation,
          difficulty: q.difficulty, generation_run_id: run.id,
        }));
        await supabase(env, "questions", {
          method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(rows),
        });
        return { count: rows.length };
      } catch (error) {
        return { count: 0, error: `${unit.grade}학년 ${unit.subject} ${unit.unit_name}: ${error.message || String(error)}` };
      }
    }));
    for (const result of results) {
      generated += result.count;
      if (result.error) errors.push(result.error);
    }
    await supabase(env, `generation_runs?id=eq.${run.id}`, {
      method: "PATCH",
      body: JSON.stringify({ generated_count: generated, error_message: errors.join("\n").slice(0, 4000) || null }),
    });
  }
  const requested = units.length * 20;
  const status = generated === requested ? "completed" : generated > 0 ? "partial" : "failed";
  await supabase(env, `generation_runs?id=eq.${run.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, generated_count: generated, error_message: errors.join("\n").slice(0, 4000) || null, finished_at: new Date().toISOString() }),
  });
  return { status, generation_date: date, requested_count: requested, generated_count: generated, unit_count: units.length, errors };
}

async function handleApi(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json({ error: "POST 요청만 허용됩니다." }, 405);
  try { envCheck(env); } catch (error) { return json({ error: error.message }, 500); }
  const user = await authenticate(request, env);
  if (!user?.id) return json({ error: "로그인이 필요합니다." }, 401);
  if (!await checkSubscription(user.id, env)) return json({ error: "유효한 이용권이 없습니다. 관리자에게 이용권 등록을 요청해 주세요." }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "요청 형식이 올바르지 않습니다." }, 400); }
  try {
    if (body.action === "start") return await startQuiz(body, user, env);
    if (body.action === "submit") return await submitAnswer(body, user, env);
    return json({ error: "지원하지 않는 요청입니다." }, 400);
  } catch (error) {
    return json({ error: error.message || "요청 처리 중 오류가 발생했습니다." }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/student-daily-quiz") return handleApi(request, env);
    if (url.pathname === "/api/health") return json({ status: "ok", service: "study-worker" });
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(generateDaily(env).catch((error) => console.error("Daily generation failed:", error)));
  },
};
