
import { GoogleGenAI, Type } from "@google/genai";
import { DocumentAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeDocument(text: string, images: string[]): Promise<DocumentAnalysis> {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Analyze the following legal document content related to the Epstein case files.
    Provide a comprehensive breakdown including:
    1. A concise summary of the document's purpose.
    2. A list of all individuals (Entities) mentioned, their roles (if identifiable), and the context of their mention.
    3. Key insights or revelations from the text.
    4. Sentiment of the document.
    5. The approximate date of the document if found.
    
    Document Text:
    ${text.substring(0, 30000)} // Truncate text to stay within safe prompt limits for quick response
  `;

  // Include images if available
  const contents = {
    parts: [
      { text: prompt },
      ...images.slice(0, 3).map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img
        }
      }))
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model,
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
                  context: { type: Type.STRING }
                },
                required: ["name", "role", "context"]
              }
            },
            keyInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            sentiment: { type: Type.STRING },
            documentDate: { type: Type.STRING }
          },
          required: ["summary", "entities", "keyInsights", "sentiment"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function aggregateAnalysis(documents: any[]): Promise<string> {
  // Logic to summarize findings across multiple documents
  const model = "gemini-3-flash-preview";
  const summaries = documents.map(d => d.analysis?.summary).join('\n\n');
  
  const response = await ai.models.generateContent({
    model,
    contents: `Based on these summaries of Epstein-related documents, provide a high-level master report on the connections and recurring themes found:\n\n${summaries}`
  });

  return response.text || "Unable to generate aggregate analysis.";
}
