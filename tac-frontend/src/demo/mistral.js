const env = import.meta.env

export const MISTRAL = {
  url: (env.VITE_MISTRAL_URL || "").replace(/\/$/, ""),
  model: env.VITE_MISTRAL_MODEL || "mistral",
  key: env.VITE_MISTRAL_KEY || "",
}

export const MISTRAL_ACTIF = Boolean(MISTRAL.url)

export async function askMistral(prompt, { system, maxTokens = 600 } = {}) {
  const messages = [...(system ? [{ role: "system", content: system }] : []), { role: "user", content: prompt }]
  let res
  try {
    res = await fetch(`${MISTRAL.url}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(MISTRAL.key ? { Authorization: `Bearer ${MISTRAL.key}` } : {}) },
      body: JSON.stringify({ model: MISTRAL.model, messages, temperature: 0.2, max_tokens: maxTokens }),
    })
  } catch {
    throw new Error(`Mistral injoignable (${MISTRAL.url})`)
  }
  if (!res.ok) throw new Error(`Mistral : erreur ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ""
}
