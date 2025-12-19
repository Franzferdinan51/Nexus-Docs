
import { GoogleGenAI, Type } from "@google/genai";
import { DocumentAnalysis } from "../types";

export async function analyzeDocument(text: string, images: string[], modelName: string = 'gemini-3-pro-preview'): Promise<DocumentAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    TASK: ANALYZE EPSTEIN CASE FILE DOCUMENT
    
    1. SUMMARY: Provide a precise summary.
    2. ENTITIES: List EVERY person. Flag "isFamous: true" for high-profile individuals (political figures, celebrities, billionaires).
    3. POIs: Specifically list any "People of Interest" found.
    4. KEY INSIGHTS: Direct revelations.
    5. IMAGES: If image data is provided, describe what is seen (e.g., "Photograph of person X", "Handwritten ledger").
    
    DOCUMENT CONTENT:
    ${text.substring(0, 40000)}
  `;

  const contents = {
    parts: [
      { text: prompt },
      ...images.slice(0, 5).map(img => ({
        inlineData: { mimeType: "image/jpeg", data: img }
      }))
    ]
  };

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                context: { type: Type.STRING },
                isFamous: { type: Type.BOOLEAN }
              },
              required: ["name", "role", "context", "isFamous"]
            }
          },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING },
          documentDate: { type: Type.STRING },
          flaggedPOIs: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["summary", "entities", "keyInsights", "sentiment", "flaggedPOIs"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function ragChat(query: string, contextDocs: any[], history: any[], modelName: string = 'gemini-3-pro-preview'): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt
  });

  return response.text || "The agent was unable to synthesize a response.";
}
