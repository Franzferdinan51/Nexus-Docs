
import { DocumentAnalysis } from "../types";

/**
 * Strips markdown code blocks from a string to ensure valid JSON parsing.
 */
function cleanJsonResponse(text: string): string {
  return text.replace(/```json\n?|```/g, '').trim();
}

export async function analyzeWithOpenRouter(
  text: string, 
  images: string[], 
  apiKey: string, 
  model: string = 'google/gemini-2.0-flash-001'
): Promise<DocumentAnalysis> {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Check Control settings.");
  }

  const prompt = `
    TASK: ANALYZE EPSTEIN CASE FILE DOCUMENT. 
    OUTPUT ONLY VALID JSON.
    
    1. summary: A precise 2-sentence summary of the document's nature and core content.
    2. entities: List EVERY person mentioned. Include isFamous: true for high-profile targets (politicians, billionaires, celebrities).
    3. keyInsights: Direct revelations or significant details found in the text or images.
    4. flaggedPOIs: List names of key targets or individuals of specific interest.
    
    DOCUMENT TEXT CONTENT:
    ${text.substring(0, 30000)}
  `;

  // Construct message with vision support if images are present
  const messageContent: any[] = [{ type: "text", text: prompt }];
  
  // Add up to 5 images for vision analysis
  images.slice(0, 5).forEach((imgBase64) => {
    messageContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imgBase64}`
      }
    });
  });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Epstein Nexus"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: "system", 
            content: "You are a professional OSINT investigator. You analyze documents and images related to the Epstein case. You only output valid JSON." 
          },
          { 
            role: "user", 
            content: messageContent 
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      throw new Error(`OpenRouter Error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("OpenRouter returned an empty response.");
    }

    const rawContent = data.choices[0].message.content;
    const cleanedContent = cleanJsonResponse(rawContent);
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse OpenRouter JSON:", cleanedContent);
      throw new Error("Model failed to return valid JSON. Check the logs for raw output.");
    }

    return {
      summary: parsed.summary || "Summary extraction failed.",
      entities: parsed.entities || [],
      keyInsights: parsed.keyInsights || [],
      sentiment: "Investigative",
      documentDate: parsed.documentDate || "Unknown",
      flaggedPOIs: parsed.flaggedPOIs || []
    };
  } catch (err: any) {
    console.error("OpenRouter Service Error:", err);
    throw err;
  }
}
