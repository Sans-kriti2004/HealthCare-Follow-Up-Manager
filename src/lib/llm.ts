import OpenAI from "openai";

const fallbackPreVisit = {
  urgencyLevel: "Medium",
  chiefComplaint: "Summary unavailable - please review symptoms manually.",
  suggestedQuestions: [
    "When did the symptoms start?",
    "What makes the symptoms better or worse?",
    "Are there any existing medicines or allergies?",
  ],
};

const fallbackPostVisit = {
  summary: "Summary unavailable - please review the doctor's notes manually.",
  medicationSchedule: [],
  followUpSteps: ["Contact the clinic if symptoms worsen."],
};

async function callLLM(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal },
    );
    return response.choices[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function generatePreVisitSummary(symptoms: string) {
  const prompt = `Analyse these symptoms and return ONLY valid JSON with keys:
urgencyLevel ("Low"|"Medium"|"High"), chiefComplaint (string), suggestedQuestions (array of 3 strings).
Symptoms: ${symptoms}`;

  try {
    const content = await callLLM(prompt);
    const parsed = JSON.parse(content);
    return {
      data: parsed,
      raw: JSON.stringify(parsed),
      urgencyLevel: parsed.urgencyLevel ?? "Medium",
    };
  } catch (error) {
    console.error("Pre-visit LLM failed", error);
    return {
      data: fallbackPreVisit,
      raw: JSON.stringify(fallbackPreVisit),
      urgencyLevel: fallbackPreVisit.urgencyLevel,
    };
  }
}

export async function generatePostVisitSummary(notes: string) {
  const prompt = `Convert these clinical notes into a patient-friendly summary. Return ONLY valid JSON with keys:
summary (string, plain language), medicationSchedule (array of {drug, dosage, timing}), followUpSteps (array of strings).
Notes: ${notes}`;

  try {
    const content = await callLLM(prompt);
    const parsed = JSON.parse(content);
    return { data: parsed, raw: JSON.stringify(parsed) };
  } catch (error) {
    console.error("Post-visit LLM failed", error);
    return { data: fallbackPostVisit, raw: JSON.stringify(fallbackPostVisit) };
  }
}
