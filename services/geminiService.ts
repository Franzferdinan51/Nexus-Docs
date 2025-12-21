import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { DocumentAnalysis } from "../types";

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    entities: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          context: { type: SchemaType.STRING },
          isFamous: { type: SchemaType.BOOLEAN }
        },
        required: ["name", "role", "context", "isFamous"]
      }
    },
    keyInsights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    sentiment: { type: SchemaType.STRING },
    documentDate: { type: SchemaType.STRING },
    flaggedPOIs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    locations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    organizations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    visualObjects: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    evidenceType: { type: SchemaType.STRING },
    confidenceScore: { type: SchemaType.NUMBER },
    timelineEvents: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          event: { type: SchemaType.STRING }
        },
        required: ["date", "event"]
      }
    }
  }
};

const RESEARCH_PROMPT = `
CRITICAL INSTRUCTION: You are an elite intelligence analyst conducting a "Double Take" verification.
Your Goal: specific verification of a potential target.

TARGET TO VERIFY: "{{TARGET}}"

Task:
1. Scan the text/images specifically for "{{TARGET}}".
2. If found, extract their Role, Context, and mark as 'Famous' if applicable.
3. If NOT found, return empty lists.
4. DO NOT hallucinate. If the name is not there, say so.

Return JSON matching the schema:
{
  "summary": "Verification result for {{TARGET}}...",
  "entities": [],
  "keyInsights": [],
  "flaggedPOIs": [],
  "locations": [],
  "organizations": [],
  "visualObjects": [],
  "evidenceType": "Verification",
  "confidenceScore": 0,
  "timelineEvents": []
}
`;

const SYSTEM_PROMPT = `
TASK: ANALYZE EPSTEIN CASE FILE DOCUMENT WITH HIGH PRECISION.

CRITICAL RULES:
- EXTRACT ONLY EXPLICITLY STATED ENTITIES. DO NOT GUESS or INFER names.
- If a name is illegible or partial, ignore it.
- Role descriptions must be specific (e.g. "Pilot for JE", "Victim", "Accountant") not vague ("Woman").
- Eliminate hallucinations: If not in text/image, do not list it.

1. SUMMARY: Provide a precise summary.
2. ENTITIES: List EVERY person explicitly named. Flag "isFamous: true" for high-profile individuals (political figures, celebrities, billionaires).
3. POIs: Specifically list any "People of Interest" found (e.g., G. Maxwell, J. Epstein).
4. KEY INSIGHTS: Direct revelations backed by text.
5. IMAGES: If image data is provided, describe what is seen (e.g., "Photograph of person X", "Handwritten ledger").
6. LOCATIONS: List specific places mentioned (cities, islands, addresses).
7. ORGANIZATIONS: List companies, banks, or groups mentioned.
8. VISUAL OBJECTS: If images are present, list distinctive objects (e.g., "Safe", "Passport", "Aircraft").
9. EVIDENCE TYPE: Classify the document (e.g., "Flight Log", "Email", "Invoice", "Testimony", "Court Filing", "Photograph").
10. TIMELINE: Extract every specific date and the corresponding event into a chronological list.
11. CONFIDENCE SCORE: Rate your confidence in the extraction (0-100) based on document legibility and clarity.
12. REASONING: Briefly explain your analysis logic in the summary.

Respond with a JSON object containing:
- summary (string)
- entities (array of objects with name, role, context, isFamous)
- keyInsights (array of strings)
- sentiment (string)
- documentDate (string, if found)
- flaggedPOIs (array of strings)
- confidenceScore (number)
- timelineEvents (array of objects with date, event)
`;

export async function analyzeDocument(text: string, images: string[], apiKey: string, modelId: string = "gemini-1.5-flash", verificationTarget?: string, useSearch: boolean = false): Promise<DocumentAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey || import.meta.env.VITE_API_KEY || '');
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    tools: useSearch ? [{ googleSearch: {} }] as any : [],
  }, {
    timeout: 86400000 // 24 hours extended timeout for massive batch runs
  });

  const promptText = verificationTarget
    ? RESEARCH_PROMPT.replace("{{TARGET}}", verificationTarget) + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '')
    : SYSTEM_PROMPT + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '');

  const parts: any[] = [{ text: promptText }];

  // Add images if present
  for (const img of images.slice(0, 5)) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: img }
    });
  }

  try {
    let attempts = 0;
    const maxAttempts = 3;
    let finalError;

    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts }]
        });

        const response = result.response;
        const responseText = response.text();
        return JSON.parse(responseText);
      } catch (error: any) {
        finalError = error;
        // Check for 429 or 503 (transient errors)
        if (error.message?.includes("429") || error.message?.includes("503") || error.status === 429) {
          attempts++;
          console.warn(`Gemini 429/503 hit. Retrying in ${20 * attempts}s... (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 20000 * attempts));
          continue;
        }
        // If not transient, throw immediately to be caught below
        throw error;
      }
    }
    throw finalError; // Max retries exceeded
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Analysis failed or returned invalid JSON.",
      entities: [],
      keyInsights: [],
      sentiment: "unknown",
      flaggedPOIs: []
    };
  }
}

export async function ragChat(query: string, contextDocs: any[], history: any[], modelName: string = 'gemini-1.5-flash'): Promise<string> {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: modelName });

  const contextText = contextDocs.length > 0
    ? contextDocs.map(d => `SOURCE: ${d.name}\nANALYSIS: ${d.analysis?.summary}\nKEY FINDINGS: ${d.analysis?.keyInsights.join('; ')}\nENTITIES: ${d.analysis?.entities.map((e: any) => e.name).join(', ')}`).join('\n\n---\n\n')
    : "No direct document matches found in the active database. Answer based on general knowledge but specify that the local archive did not contain specific hits.";

  const historyText = history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

  const prompt = `
    SYSTEM: You are the NEXUS Investigative Agent. You have access to a repository of Epstein case files. 
    Your tone is clinical, objective, and thorough. 
    
    ARCHIVE CONTEXT (Extracted from user's uploaded files):
    ${contextText}
    
    CHAT HISTORY:
    ${historyText}
    
    TASK: 
    Use the ARCHIVE CONTEXT as your primary source of truth. If specific names or dates are mentioned in the query, look for them in the context. 
    If the context provided allows for a definitive answer, provide it and cite the SOURCE name.
    If you are drawing from general knowledge because the archive is insufficient, explicitly state "Based on external data (not found in current archive)..."
    
    USER QUERY: ${query}
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;

  return response.text() || "The agent was unable to synthesize a response.";
}
