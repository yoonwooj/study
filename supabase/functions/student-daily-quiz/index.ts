import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((_req: Request) => new Response(
  JSON.stringify({
    error: "이 학습 API는 Cloudflare Worker로 이전되었습니다.",
    endpoint: "/api/student-daily-quiz",
  }),
  { status: 410, headers: { "Content-Type": "application/json" } },
));
