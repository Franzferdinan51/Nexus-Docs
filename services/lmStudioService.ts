
import { DocumentAnalysis } from "../types";

/**
 * Tests connection to LM Studio by fetching available models.
 */
export async function testLMStudioConnection(endpoint: string): Promise<{ success: boolean; error?: string; models?: string[] }> {
  try {
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const models = data.data?.map((m: any) => m.id) || [];
      return { success: true, models };
    }

    return { success: false, error: `Server returned ${response.status}` };
  } catch (e: any) {
    let errorMsg = e.message || "Unknown error";
    if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
      const isHttps = window.location.protocol === 'https:';
      if (isHttps) {
        errorMsg = "Mixed Content Blocked: You are on an HTTPS site trying to connect to an HTTP local server. Browsers block this by default.";
      } else {
        errorMsg = "Network Error: Ensure LM Studio is running, CORS is enabled, and the endpoint is correct.";
      }
    }
    console.error("Connection test failed:", e);
    return { success: false, error: errorMsg };
  }
}

/**
 * Gets the first available model from LM Studio
 */
async function getAvailableModel(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].id;
      }
    }
  } catch (e) {
    console.error("Failed to get models:", e);
  }
  return null;
}

const RESEARCH_PROMPT = `
CRITICAL INSTRUCTION: You are an elite intelligence analyst conducting a "Double Take" verification.
Your Goal: specific verification of a potential target.

TARGET TO VERIFY: "{{TARGET}}"

Task:
1. Scan the text/images specifically for "{{TARGET}}".
2. If found, extract their Role, Context, and mark as 'Famous' if applicable.
3. If NOT found, return empty lists.
4. DO NOT hallucinate. If the name is not there, say so.

Return valid JSON. IMPORTANT: Escape all double quotes within strings.
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
TASK: PERFORM FORENSIC ANALYSIS OF THE PROVIDED DOCUMENT/IMAGE.

CRITICAL INSTRUCTIONS:
- IDENTIFY: Visually recognize famous individuals, political figures, or known actors if present.
- INFER: Use context clues (badges, nameplates, captions, uniforms) to deduce identities.
- DESCRIBE: If a person is unknown, provide specific details (e.g., "Man with facial scar," "Woman in pilot uniform") instead of generic labels.
- READ: extract all legible text, names, dates, and locations.

1. SUMMARY: Concise overview of who is in the image/document and what is happening.
2. ENTITIES: List EVERY person found. Use "Visually Identified" in context if recognized by face.
3. POIs: Flag any high-profile targets (Epstein, Maxwell, Politicians, Royals).
4. KEY INSIGHTS: Connect visual elements to potential evidence (e.g., "Meeting suggests close association").
5. VISUAL OBJECTS: distinctive items (Safe, Aircraft Tail Number, Passport).
6. EVIDENCE TYPE: e.g., "Surveillance Photo", "Flight Log", "Passport Scan".
7. TIMELINE: Chronological list of events ({ date, event }).
8. CONFIDENCE: 0-100 score of your certainty.

Respond with a valid JSON object. IMPORTANT: Escape all double quotes within strings.
Containing:
- summary (string)
- entities (array of objects with name, role, context, isFamous)
- keyInsights (array of strings)
- sentiment (string)
- documentDate (string, if found)
- flaggedPOIs (array of strings)
- locations (array of strings)
- organizations (array of strings)
- visualObjects (array of strings)
- evidenceType (string)
- confidenceScore (number)
- timelineEvents (array of {date, event})
`;

export async function analyzeWithLMStudio(text: string, images: string[], endpoint: string, verificationTarget?: string, requestedModelId?: string, useSearch: boolean = false): Promise<DocumentAnalysis | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 86400000); // 24 hour timeout for massive batch runs

  try {
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
    const url = `${baseUrl}/v1/chat/completions`;

    // Get the actual loaded model name OR use requested one
    let modelId: string | null | undefined = requestedModelId;
    if (!modelId) {
      modelId = await getAvailableModel(baseUrl);
    }

    if (!modelId) {
      throw new Error("No model loaded in LM Studio and no Model ID specified.");
    }

    // Context-Aware Verification Logic
    let promptText = "";
    if (verificationTarget) {
      if (typeof verificationTarget === 'object') {
        // Rich Context: Name, Role, and Snippet
        const vt = verificationTarget as any;
        let contextPrompt = RESEARCH_PROMPT.replace("{{TARGET}}", vt.name);
        contextPrompt += `\n\nCONTEXT FROM SWARM:\nExpected Role: ${vt.role}\nKey Excerpt: "${vt.context}"\n\nVERIFICATION INSTRUCTION: Verify if the text explicitly supports this role/context for ${vt.name}.`;
        promptText = contextPrompt + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '');
      } else {
        // Legacy String Mode (Name Only)
        promptText = RESEARCH_PROMPT.replace("{{TARGET}}", verificationTarget as string) + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '');
      }
    } else {
      // Standard Discovery Mode
      promptText = SYSTEM_PROMPT + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '');
    }

    // Construct standard OpenAI-compatible vision payload
    const content: any[] = [{ type: "text", text: promptText }];

    // Append images
    if (images && images.length > 0) {
      images.slice(0, 3).forEach(imgData => {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imgData}`
          }
        });
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that outputs strictly valid JSON."
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("LM Studio error response:", errorText);
      throw new Error(`HTTP Error: ${response.status} - ${errorText || "Check if LM Studio server is running and model is loaded."}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content || "";

    // Clean the response
    let cleanedContent = responseContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
    }

    // Try to extract JSON from the response
    let parsed: any = null;
    try {
      // Try direct parse first
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      // Try to find the outermost JSON object if direct parse fails
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = cleanedContent.substring(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(potentialJson);
        } catch (innerError) {
          console.error("Failed to parse extracted JSON:", potentialJson);
        }
      }

      if (!parsed) {
        console.error("Failed to parse JSON from response:", responseContent);
      }
    }

    if (!parsed) {
      // Return a basic analysis with the raw content if JSON parse fails
      console.warn("LM Studio returned raw text, not JSON. Fallback active.");
      return {
        summary: responseContent.substring(0, 500) || "Could not extract summary.",
        entities: [],
        keyInsights: [responseContent.substring(0, 200)],
        sentiment: "Local Analysis (Raw)",
        documentDate: "Unknown",
        flaggedPOIs: []
      };
    }

    return {
      summary: parsed.summary || "Summary extraction failed.",
      entities: parsed.entities || [],
      keyInsights: parsed.keyInsights || [],
      sentiment: parsed.sentiment || "Local Analysis",
      documentDate: parsed.documentDate || "Unknown",
      flaggedPOIs: parsed.flaggedPOIs || [],
      locations: parsed.locations || [],
      organizations: parsed.organizations || [],
      visualObjects: parsed.visualObjects || [],
      evidenceType: parsed.evidenceType || "Unknown",
      confidenceScore: parsed.confidenceScore || 0,
      timelineEvents: parsed.timelineEvents || []
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Local inference timed out. The model took too long to respond.");
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const isHttps = window.location.protocol === 'https:';
      let msg = "LM Studio Connection Failed.";
      if (isHttps) {
        msg += " Mixed Content Blocked. Browsers block HTTPS -> HTTP localhost. You MUST allow 'Insecure Content' for this site in browser settings.";
      } else {
        msg += " Ensure CORS is enabled in LM Studio Server settings.";
      }
      throw new Error(msg);
    }
    throw error;
  }
}
