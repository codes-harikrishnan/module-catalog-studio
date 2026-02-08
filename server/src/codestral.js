export async function callCodestralJSON(cfg, messages, temperature = 0.2) {
  if (!cfg?.baseUrl || !cfg?.token) return { ok: false, reason: "CODESTRAL not configured" };

  const url = new URL(cfg.route ?? "/v1/chat/completions", cfg.baseUrl);
  const body = {
    model: cfg.model ?? "codestral-latest",
    temperature,
    messages,
    response_format: { type: "json_object" }
  };

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, reason: `HTTP ${res.status}: ${t}` };
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return { ok: false, reason: "Unexpected response format" };

  try {
    return { ok: true, data: JSON.parse(content), rawText: content };
  } catch {
    return { ok: false, reason: "Failed to parse LLM JSON", rawText: content };
  }
}

export function rid() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}
