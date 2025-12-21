
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
  model: string = 'google/gemini-2.0-flash-001',
  verificationTarget?: string
): Promise<DocumentAnalysis> {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Check Control settings.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 86400000); // 24 hour timeout

  const promptText = verificationTarget
    ? `
      CRITICAL INSTRUCTION: You are an elite intelligence analyst conducting a "Double Take" verification.
      Your Goal: specific verification of a potential target.

      TARGET TO VERIFY: "${verificationTarget}"

      Task:
      1. Scan the text/images specifically for "${verificationTarget}".
      2. If found, extract their Role, Context, and mark as 'Famous' if applicable.
      3. If NOT found, return empty lists.
      4. DO NOT hallucinate. If the name is not there, say so.

      Return JSON matching the schema:
      {
        "summary": "Verification result for ${verificationTarget}...",
        "entities": [],
        "keyInsights": [],
        "flaggedPOIs": [],
        "locations": [],
        "organizations": [],
        "visualObjects": [],
        "evidenceType": "Verification"
      }
      `
    : `
    TASK: ANALYZE EPSTEIN CASE FILE DOCUMENT WITH HIGH PRECISION.
    OUTPUT ONLY VALID JSON.
    
    CRITICAL RULES:
    - EXTRACT ONLY EXPLICITLY STATED ENTITIES. DO NOT GUESS or INFER names.
    - If a name is illegible or partial, ignore it.
    - Role descriptions must be specific (e.g. "Pilot for JE", "Victim", "Accountant") not vague ("Woman").
    - Eliminate hallucinations: If not in text/image, do not list it.

    1. summary: A precise 2-sentence summary of the document's nature and core content.
    2. entities: List EVERY person mentioned. Include isFamous: true for high-profile targets (politicians, billionaires, celebrities).
    3. keyInsights: Direct revelations or significant details found in the text or images.
    4. flaggedPOIs: List names of key targets or individuals of specific interest.
    5. locations: List specific places mentioned (cities, islands, addresses).
    6. organizations: List companies, banks, or groups mentioned.
    7. visualObjects: If images are present, list distinctive objects (e.g., "Safe", "Passport").
    8. evidenceType: Classify the document (e.g., "Flight Log", "Email", "Invoice", "Testimony", "Court Filing", "Photograph").
    
    DOCUMENT TEXT CONTENT:
    ${text ? text.substring(0, 30000) : ''}
  `;

  // Construct message with vision support if images are present
  const messageContent: any[] = [{ type: "text", text: promptText }];

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
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
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
      flaggedPOIs: parsed.flaggedPOIs || [],
      locations: parsed.locations || [],
      organizations: parsed.organizations || [],
      visualObjects: parsed.visualObjects || [],
      evidenceType: parsed.evidenceType || "Unknown"
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("OpenRouter Service Error:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
