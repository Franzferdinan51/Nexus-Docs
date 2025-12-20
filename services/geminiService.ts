import { GoogleGenerativeAI } from "@google/generative-ai";
import { DocumentAnalysis } from "../types";

export async function analyzeDocument(text: string, images: string[], modelName: string = 'gemini-1.5-flash'): Promise<DocumentAnalysis> {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
    TASK: ANALYZE EPSTEIN CASE FILE DOCUMENT
    
    1. SUMMARY: Provide a precise summary.
    2. ENTITIES: List EVERY person. Flag "isFamous: true" for high-profile individuals (political figures, celebrities, billionaires).
    3. POIs: Specifically list any "People of Interest" found.
    4. KEY INSIGHTS: Direct revelations.
    5. IMAGES: If image data is provided, describe what is seen (e.g., "Photograph of person X", "Handwritten ledger").
    
    Respond with a JSON object containing:
    - summary (string)
    - entities (array of objects with name, role, context, isFamous)
    - keyInsights (array of strings)
    - sentiment (string)
    - documentDate (string, if found)
    - flaggedPOIs (array of strings)
    
    DOCUMENT CONTENT:
    ${text.substring(0, 40000)}
  `;

  const parts: any[] = [{ text: prompt }];

  // Add images if present
  for (const img of images.slice(0, 5)) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: img }
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const response = result.response;
  const responseText = response.text();

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      summary: responseText,
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
