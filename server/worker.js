/*
 * EAT & BURN 사진 칼로리 분석 서버 (Cloudflare Workers용)
 *
 * 하는 일: 홈페이지에서 보낸 음식 사진을 Claude(AI)에게 보내고,
 *         음식별 칼로리·영양 성분을 JSON으로 돌려줘요.
 *
 * 꼭 할 일
 *  1) Cloudflare Worker 설정의 'Variables and Secrets'에
 *     이름 ANTHROPIC_API_KEY 로 Anthropic API 키를 'Secret'으로 넣으세요.
 *     (키를 이 파일에 직접 적으면 안 돼요!)
 *  2) 아래 ALLOWED_ORIGINS에 내 홈페이지 주소(도메인까지만)가 들어 있는지 확인하세요.
 */

// 이 주소에서 온 요청만 받아요. 다른 사이트가 내 서버(=내 돈)를 쓰지 못하게 막는 장치예요.
const ALLOWED_ORIGINS = [
  "https://xmow174-create.github.io",
];

// 사용할 AI 모델. 빠르고 저렴한 모델로 정해 뒀어요.
const MODEL = "claude-haiku-5-5";

// 사진 한 장의 최대 크기 (base64 글자 수 기준, 약 1.5MB)
const MAX_IMAGE_CHARS = 2_000_000;

const PROMPT = `당신은 한국의 영양사입니다. 사진 속 음식을 식별하고, 보이는 양을 기준으로 칼로리와 영양 성분을 추정하세요.
반드시 아래 형식의 JSON 하나만 출력하세요. 다른 말은 쓰지 마세요.
{
  "is_food": true,
  "dish": "대표 음식 이름 (한국어, 짧게)",
  "items": [
    {"name": "구성 음식 이름", "portion": "추정 양 (예: 1공기 210g)", "kcal": 숫자, "carbs_g": 숫자, "protein_g": 숫자, "fat_g": 숫자}
  ],
  "note": "추정 근거나 주의점 한 문장 (한국어)"
}
- 음식이 아니면 {"is_food": false, "note": "이유"} 만 출력하세요.
- 밥, 국, 반찬, 소스, 음료 등 보이는 것은 각각 items에 나누어 넣으세요.
- 숫자는 일반적인 1인분 또는 사진에 보이는 양 기준의 현실적인 정수로 추정하세요. 한국 음식이면 한국 식품 영양 정보 기준을 따르세요.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "POST 요청만 받아요." }, 405, cors);
    if (!allowed) return json({ error: "허용되지 않은 사이트에서 온 요청이에요." }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "서버에 API 키가 설정되지 않았어요." }, 500, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "요청 형식이 올바르지 않아요." }, 400, cors); }
    const image = typeof body.image === "string" ? body.image.replace(/^data:image\/\w+;base64,/, "") : "";
    if (!image) return json({ error: "사진이 없어요." }, 400, cors);
    if (image.length > MAX_IMAGE_CHARS) return json({ error: "사진이 너무 커요. 다른 사진으로 해 주세요." }, 413, cors);

    let ai;
    try {
      ai = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
              { type: "text", text: PROMPT },
            ],
          }],
        }),
      });
    } catch {
      return json({ error: "AI 서버에 연결하지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, 502, cors);
    }

    if (!ai.ok) {
      const msg = ai.status === 429 ? "요청이 많아요. 잠시 뒤에 다시 시도해 주세요."
        : ai.status === 401 ? "서버의 API 키가 올바르지 않아요. (운영자 확인 필요)"
        : "AI 분석 중 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.";
      return json({ error: msg }, 502, cors);
    }

    const data = await ai.json();
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "결과를 읽지 못했어요. 다시 시도해 주세요." }, 502, cors);
    try {
      return json(JSON.parse(match[0]), 200, cors);
    } catch {
      return json({ error: "결과를 읽지 못했어요. 다시 시도해 주세요." }, 502, cors);
    }
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}
