export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { userContent } = req.body || {};
    if (!userContent || typeof userContent !== "string") {
      return res.status(400).json({ error: "Missing userContent" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GROQ_API_KEY environment variable" });
    }

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: userContent }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await groqRes.json().catch(() => ({}));

    if (!groqRes.ok) {
      const message = data?.error?.message || data?.error || "Groq API error";
      return res.status(groqRes.status).json({ error: message });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No response from Groq" });
    }

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
