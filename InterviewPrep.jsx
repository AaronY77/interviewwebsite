import { useMemo, useState } from "react";

const INDUSTRIES = [
  { id: "software", label: "Software Engineering", icon: "ti-code" },
  { id: "finance", label: "Finance & Banking", icon: "ti-chart-line" },
  { id: "healthcare", label: "Healthcare", icon: "ti-stethoscope" },
  { id: "marketing", label: "Marketing & Growth", icon: "ti-speakerphone" },
  { id: "consulting", label: "Management Consulting", icon: "ti-briefcase" },
];

const METRICS = [
  { key: "accuracy", label: "Accuracy", color: "#059669", bg: "#D1FAE5", text: "#065F46" },
  { key: "communication", label: "Communication", color: "#2563EB", bg: "#DBEAFE", text: "#1E3A8A" },
  { key: "reasoning", label: "Reasoning", color: "#D97706", bg: "#FEF3C7", text: "#92400E" },
];

function ScoreRing({ score, color, size = 64 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const filled = circ * (Math.min(Math.max(score || 0, 0), 10) / 10);
  const fs = size < 44 ? 10 : 15;
  const dy = size < 44 ? 4 : 6;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
      />
      <text
        x={size / 2}
        y={size / 2 + dy}
        textAnchor="middle"
        fontSize={fs}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#111827"
      >
        {score}
      </text>
    </svg>
  );
}

function MetricCard({ metricDef, score, feedback, delay }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      padding: "18px 20px",
      borderRadius: 14,
      border: "1.5px solid #E5E7EB",
      background: "#FAFAFA",
      animation: `slideUp 0.4s ease ${delay}s both`,
    }}>
      <ScoreRing score={score} color={metricDef.color} size={60} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: metricDef.color
          }}>
            {metricDef.label}
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            background: metricDef.bg,
            color: metricDef.text,
            padding: "1px 8px",
            borderRadius: 20,
          }}>
            {score}/10
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
          {feedback}
        </p>
      </div>
    </div>
  );
}

function DifficultyBar({ value }) {
  const segments = Array.from({ length: 10 }, (_, i) => i + 1);
  const getColor = (v) => v <= 3 ? "#10B981" : v <= 6 ? "#F59E0B" : v <= 8 ? "#EF4444" : "#7C3AED";
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {segments.map(n => (
        <div key={n} style={{
          flex: 1,
          height: 5,
          borderRadius: 99,
          background: n <= value ? getColor(value) : "#E5E7EB",
          transition: "background 0.2s ease"
        }} />
      ))}
    </div>
  );
}

const initialState = {
  industry: "software",
  difficulty: 5,
  question: "",
  response: "",
  feedback: null,
  loadingQ: false,
  loadingF: false,
  error: "",
};

export default function InterviewPrep() {
  const [industry, setIndustry] = useState(initialState.industry);
  const [difficulty, setDifficulty] = useState(initialState.difficulty);
  const [question, setQuestion] = useState(initialState.question);
  const [response, setResponse] = useState(initialState.response);
  const [feedback, setFeedback] = useState(initialState.feedback);
  const [loadingQ, setLoadingQ] = useState(initialState.loadingQ);
  const [loadingF, setLoadingF] = useState(initialState.loadingF);
  const [error, setError] = useState(initialState.error);

  const selectedInd = useMemo(() => INDUSTRIES.find(i => i.id === industry) ?? INDUSTRIES[0], [industry]);
  const diffLabel = difficulty <= 3 ? "Entry Level" : difficulty <= 6 ? "Mid Level" : difficulty <= 8 ? "Senior" : "Principal";
  const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0;
  const overall = feedback
    ? Math.round((feedback.accuracy.score + feedback.communication.score + feedback.reasoning.score) / 3)
    : null;

  const callGroq = async (userContent) => {
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userContent }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Groq request failed");
    }
    if (!data?.content) throw new Error("No response");
    return String(data.content).trim();
  };

  const resetSession = () => {
    setQuestion("");
    setResponse("");
    setFeedback(null);
    setError("");
  };

  const generateQuestion = async () => {
    setLoadingQ(true);
    setQuestion("");
    setResponse("");
    setFeedback(null);
    setError("");

    try {
      const industryGuide = {
        software: "algorithms, data structures, time/space complexity, system design, coding problems (describe code or pseudocode), recursion, dynamic programming, OS concepts, networking, databases",
        finance: "quantitative finance, probability and statistics, options pricing, present value calculations, portfolio math, financial modeling, accounting equations, derivatives, fixed income math, risk metrics like VaR and Sharpe ratio",
        healthcare: "biostatistics, pharmacokinetics, clinical trial design, sensitivity/specificity/PPV/NPV calculations, physiology mechanics, dosage calculations, epidemiology formulas, anatomy and pathophysiology mechanisms",
        marketing: "A/B test statistics and significance, conversion rate math, cohort analysis, customer lifetime value calculations, attribution modeling, regression and correlation, experiment design, funnel math",
        consulting: "market sizing math, break-even analysis, unit economics, profitability calculations, supply/demand logic, operations research problems, estimation problems with numerical answers, decision trees with expected value",
      };

      const q = await callGroq(
`You are a technical interviewer writing a rigorous textbook-style exam question.

Generate ONE technical question for a ${selectedInd.label} candidate. Difficulty: ${difficulty}/10.

Question type guidelines for ${selectedInd.label}:
Focus exclusively on: ${industryGuide[industry]}

Difficulty scale:
1-3: Foundational — definitions, basic formulas, simple single-step problems
4-6: Intermediate — multi-step problems, requires combining two or more concepts, some derivation
7-9: Advanced — complex derivations, algorithm design, proofs, non-obvious problem setups
10: Expert — open-ended hard problems, requires deep insight or uncommon techniques

STRICT RULES:
- Ask about concepts, math, algorithms, or problem-solving — NOT about past experience, teamwork, or workplace scenarios
- Frame it like a textbook problem or technical exam question
- If numerical, include specific numbers to work with
- If algorithmic, describe the exact input/output and constraints
- Do NOT ask "tell me about a time when..." or any behavioral question
- Do NOT mention companies, jobs, or real-world work context

Respond with ONLY the question itself — no preamble, no label, no answer.`
      );

      setQuestion(q);
    } catch (err) {
      setError(err?.message || "Failed to generate a question. Please try again.");
    } finally {
      setLoadingQ(false);
    }
  };

  const getFeedback = async () => {
    if (!response.trim() || !question.trim()) return;
    setLoadingF(true);
    setFeedback(null);
    setError("");

    try {
      const raw = await callGroq(
`You are an expert interview coach evaluating a candidate for a ${selectedInd.label} role (difficulty ${difficulty}/10 — ${diffLabel}).

Interview question: "${question}"

Candidate's response: "${response}"

Evaluate on exactly three metrics. Return ONLY valid JSON — no markdown fences, no explanation, just the object:
{
  "accuracy": { "score": <integer 1-10>, "feedback": "<1-2 concise sentences about factual correctness, relevance, and completeness>" },
  "communication": { "score": <integer 1-10>, "feedback": "<1-2 concise sentences about clarity, structure, and how well they conveyed their points>" },
  "reasoning": { "score": <integer 1-10>, "feedback": "<1-2 concise sentences about logical depth, analytical thinking, and problem-solving approach>" }
}

Be honest and specific. Factor in the difficulty level when calibrating scores.`
      );

      const cleaned = raw.replace(/```json\n?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setFeedback(parsed);
    } catch (err) {
      setError(err?.message || "Could not parse feedback. Please try again.");
    } finally {
      setLoadingF(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        * { box-sizing: border-box; }
        html, body, #root { min-height: 100%; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #F3F4F6; }
        select, input[type=range] { cursor: pointer; }
        .card { animation: slideUp 0.35s ease both; }
        .btn-primary {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 11px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { cursor: not-allowed; }
        .btn-ghost {
          width: 100%;
          padding: 11px;
          border: 1.5px solid #E5E7EB;
          border-radius: 11px;
          background: white;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          color: #374151;
          transition: all 0.15s ease;
        }
        .btn-ghost:hover { background: #F9FAFB; border-color: #D1D5DB; }
        textarea:focus { outline: none; border-color: #1D4ED8 !important; }
        select:focus { outline: 2px solid #1D4ED8; outline-offset: 2px; border-radius: 10px; }
        input[type=range] { accent-color: #1D4ED8; }
        a { color: inherit; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#F3F4F6", paddingBottom: 60 }}>
        <div style={{
          background: "#111827",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#F97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <i className="ti ti-bolt" style={{ fontSize: 18, color: "white" }} aria-hidden />
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              PrepMate
            </div>
            <div style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>AI Interview Coach</div>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
          <div className="card" style={{
            background: "white",
            borderRadius: 18,
            padding: 28,
            boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
            marginBottom: 18,
          }}>
            <h2 style={{ margin: "0 0 22px", fontSize: 19, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              Session Setup
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  Industry
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={industry}
                    onChange={e => { setIndustry(e.target.value); resetSession(); }}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #E5E7EB",
                      background: "white",
                      fontSize: 14,
                      color: "#111827",
                      appearance: "none",
                      fontFamily: "inherit"
                    }}
                  >
                    {INDUSTRIES.map(i => (
                      <option key={i.id} value={i.id}>{i.label}</option>
                    ))}
                  </select>
                  <i className="ti ti-chevron-down" aria-hidden style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    fontSize: 16,
                    pointerEvents: "none"
                  }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  Difficulty —{" "}
                  <span style={{ color: "#F97316" }}>{difficulty}/10</span>
                  <span style={{ color: "#9CA3AF", fontWeight: 500, textTransform: "none", letterSpacing: 0, marginLeft: 5, fontSize: 10 }}>
                    ({diffLabel})
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={difficulty}
                  step={1}
                  onChange={e => { setDifficulty(Number(e.target.value)); resetSession(); }}
                  style={{ width: "100%", marginBottom: 6, display: "block", marginTop: 10 }}
                />
                <DifficultyBar value={difficulty} />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={generateQuestion}
              disabled={loadingQ}
              style={{ background: loadingQ ? "#9CA3AF" : "#F97316", color: "white" }}
            >
              {loadingQ
                ? <span style={{ display: "inline-block", animation: "pulse 1.2s ease infinite" }}>
                    <i className="ti ti-loader-2" aria-hidden /> Generating question…
                  </span>
                : question
                  ? <><i className="ti ti-refresh" aria-hidden /> New Question</>
                  : <><i className={`ti ${selectedInd?.icon}`} aria-hidden /> Generate Question</>
              }
            </button>
          </div>

          {question && (
            <div className="card" style={{
              background: "#111827",
              borderRadius: 18,
              padding: "24px 28px",
              marginBottom: 18
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <i className={`ti ${selectedInd?.icon}`} style={{ color: "#F97316", fontSize: 15 }} aria-hidden />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {selectedInd?.label} · Level {difficulty} · {diffLabel}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: "#F9FAFB", fontWeight: 500, letterSpacing: "-0.01em" }}>
                {question}
              </p>
            </div>
          )}

          {question && (
            <div className="card" style={{
              background: "white",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
              animationDelay: "0.08s"
            }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                Your Answer
              </label>
              <textarea
                value={response}
                onChange={e => { setResponse(e.target.value); setFeedback(null); }}
                placeholder="Walk through your answer in detail. Include your reasoning process, relevant examples, and key points. The more depth you provide, the more specific your feedback will be."
                rows={7}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid #E5E7EB",
                  fontSize: 14,
                  color: "#111827",
                  lineHeight: 1.65,
                  resize: "vertical",
                  fontFamily: "inherit",
                  background: "#FAFAFA",
                  transition: "border-color 0.15s ease"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : "Start typing your answer above"}
                </span>
                {wordCount > 0 && wordCount < 30 && (
                  <span style={{ fontSize: 12, color: "#D97706" }}>
                    <i className="ti ti-info-circle" aria-hidden /> Longer answers get richer feedback
                  </span>
                )}
              </div>

              <button
                className="btn-primary"
                onClick={getFeedback}
                disabled={loadingF || !response.trim()}
                style={{
                  background: (!response.trim() || loadingF) ? "#E5E7EB" : "#1D4ED8",
                  color: (!response.trim() || loadingF) ? "#9CA3AF" : "white",
                }}
              >
                {loadingF
                  ? <span style={{ display: "inline-block", animation: "pulse 1.2s ease infinite" }}>
                      Evaluating your response…
                    </span>
                  : <>Get Feedback <i className="ti ti-arrow-right" aria-hidden /></>
                }
              </button>

              {error && (
                <div style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  fontSize: 13,
                  color: "#B91C1C",
                  display: "flex",
                  gap: 8,
                  alignItems: "center"
                }}>
                  <i className="ti ti-alert-circle" aria-hidden />
                  {error}
                </div>
              )}

              {feedback && (
                <div style={{ marginTop: 28 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 18,
                    padding: "14px 18px",
                    background: "#EFF6FF",
                    borderRadius: 12,
                    border: "1.5px solid #BFDBFE"
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>
                        Overall Score
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#1E3A8A", letterSpacing: "-0.02em", lineHeight: 1 }}>
                        {overall}/10
                      </div>
                    </div>
                    <ScoreRing score={overall} color="#1D4ED8" size={52} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {METRICS.map((m, idx) => (
                      <MetricCard
                        key={m.key}
                        metricDef={m}
                        score={feedback[m.key].score}
                        feedback={feedback[m.key].feedback}
                        delay={idx * 0.08}
                      />
                    ))}
                  </div>

                  <button className="btn-ghost" onClick={resetSession}>
                    <i className="ti ti-refresh" aria-hidden /> Practice Another Question
                  </button>
                </div>
              )}
            </div>
          )}

          {!question && !loadingQ && (
            <div className="card" style={{
              textAlign: "center",
              padding: "40px 24px",
              color: "#9CA3AF",
              animationDelay: "0.1s"
            }}>
              <i className="ti ti-microphone-2" style={{ fontSize: 40, display: "block", marginBottom: 12, color: "#D1D5DB" }} aria-hidden />
              <div style={{ fontSize: 15, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>Ready when you are</div>
              <div style={{ fontSize: 13 }}>Select your industry and difficulty, then generate a question to begin.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
