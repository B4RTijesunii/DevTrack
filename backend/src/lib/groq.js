import fetch from "node-fetch";

const MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function generateText(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in .env");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned no text in response");
  }
  return text.trim();
}
