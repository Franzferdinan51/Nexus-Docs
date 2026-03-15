
import { DocumentAnalysis } from "../types";

interface LMStudioModel {
  id: string;
  object: string;
  owned_by: string;
}

interface TestConnectionResult {
  success: boolean;
  error?: string;
  models?: string[];
  visionModels?: string[];
  textModels?: string[];
}

/**
 * Tests connection to LM Studio by fetching available models and categorizing vision vs text models.
 */
export async function testLMStudioConnection(endpoint: string): Promise<TestConnectionResult> {
  const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
  
  try {
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
      const models = data.data?.map((m: LMStudioModel) => m.id) || [];
      
      // Categorize models by capability
      const visionModels = models.filter((id: string) => 
        /vl|vision|see|eye|qwen.*vision|jan.*vl|gemma.*vision|llava|mini.*gemini/i.test(id)
      );
      const textModels = models.filter((id: string) => 
        !/vl|vision|see|eye|embedding/i.test(id)
      );

      console.log(`[LM Studio] Found ${models.length} models: ${visionModels.length} vision-capable, ${textModels.length} text-only`);
      
      return { success: true, models, visionModels, textModels };
    }

    return { success: false, error: `Server returned ${response.status}` };
  } catch (e: any) {
    let errorMsg = e.message || "Unknown error";
    if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (isHttps) {
        errorMsg = "Mixed Content Blocked: You are on an HTTPS site trying to connect to an HTTP local server. Browsers block this by default.";
      } else {
        errorMsg = "Network Error: Ensure LM Studio is running, CORS is enabled, and the endpoint is correct.";
      }
    }
    console.error("[LM Studio] Connection test failed:", e);
    return { success: false, error: errorMsg };
  }
}

/**
 * Tests if LM Studio can handle a vision request with a specific model
 */
export async function testLMStudioVision(endpoint: string, modelId: string): Promise<{ success: boolean; error?: string }> {
  const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
  const url = `${baseUrl}/v1/chat/completions`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for vision test

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Respond with exactly: VISION_TEST_PASSED" },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                }
              }
            ]
          }
        ],
        max_tokens: 50
      })
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      if (content.includes("VISION_TEST_PASSED")) {
        console.log(`[LM Studio] Vision test PASSED for model: ${modelId}`);
        return { success: true };
      } else {
        console.log(`[LM Studio] Vision test returned unexpected response: ${content.substring(0, 100)}`);
        return { success: true }; // Still works, just different response format
      }
    }

    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
  } catch (e: any) {
    console.error(`[LM Studio] Vision test failed for ${modelId}:`, e);
    return { success: false, error: e.message };
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
  const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
  const url = `${baseUrl}/v1/chat/completions`;
  
  // Retry configuration for unstable connections (Tailscale, etc.)
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 86400000);

    try {
      // Check connection before each attempt
      if (attempt > 1) {
        console.log(`[LM Studio] Retry attempt ${attempt}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt)); // Exponential backoff
        
        // Quick connection check
        const connectionCheck = await fetch(`${baseUrl}/v1/models`, { 
          method: 'GET', 
          signal: controller.signal,
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        }).catch(() => ({ ok: false }));
        
        if (!connectionCheck.ok) {
          throw new Error("Connection lost - LM Studio unreachable");
        }
      }

      // Get the actual loaded model name OR use requested one
      let modelId: string | null | undefined = requestedModelId;
      if (!modelId) {
        modelId = await getAvailableModel(baseUrl);
      }

      if (!modelId) {
        throw new Error("No model loaded in LM Studio and no Model ID specified.");
      }

    const promptText = verificationTarget
      ? RESEARCH_PROMPT.replace("{{TARGET}}", verificationTarget) + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '')
      : SYSTEM_PROMPT + (text ? `\nDOCUMENT CONTENT:\n${text.substring(0, 40000)}` : '');

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
    lastError = error;
    
    // Check if this is a retryable error
    const isRetryable = 
      error.message?.includes('No models loaded') ||
      error.message?.includes('Tailscale') ||
      error.message?.includes('WebSocket') ||
      error.message?.includes('Connection') ||
      error.message?.includes('Failed to fetch');
    
    if (attempt < MAX_RETRIES && isRetryable) {
      console.warn(`[LM Studio] Attempt ${attempt} failed: ${error.message}. Retrying...`);
      continue; // Retry
    }
    
    // All retries exhausted or non-retryable error
    if (error.name === 'AbortError') {
      throw new Error("Local inference timed out. The model took too long to respond.");
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      let msg = "LM Studio Connection Failed.";
      if (isHttps) {
        msg += " Mixed Content Blocked. Browsers block HTTPS -> HTTP localhost. Allow 'Insecure Content' in browser settings.";
      } else {
        msg += " Ensure CORS is enabled in LM Studio Server settings (Developer → CORS).";
      }
      throw new Error(msg);
    }
    if (error.message?.includes('No models loaded')) {
      throw new Error(`LM Studio: No model loaded. Please open LM Studio on the remote machine and load a model (e.g., qwen3.5-9b) in the Developer tab.`);
    }
    if (error.message?.includes('Tailscale') || error.message?.includes('WebSocket')) {
      throw new Error(`LM Studio: Connection dropped (Tailscale/WebSocket). This is a network issue - check if the remote machine is awake and Tailscale is connected.`);
    }
    throw error;
  }
  
  }
  
  // All retries exhausted
  throw new Error(`LM Studio failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`);
}
