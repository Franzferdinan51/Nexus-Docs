
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

export async function analyzeWithLMStudio(text: string, images: string[], endpoint: string): Promise<DocumentAnalysis | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout for local models

  try {
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
    const url = `${baseUrl}/v1/chat/completions`;

    // Get the actual loaded model name
    const modelId = await getAvailableModel(baseUrl);
    if (!modelId) {
      throw new Error("No model loaded in LM Studio. Please load a model first.");
    }

    // Identical prompt to Gemini service
    const promptText = `
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

    // Try to extract JSON from the response
    let parsed: any = null;
    try {
      // Try direct parse first
      parsed = JSON.parse(responseContent);
    } catch {
      // Try to find JSON in the response (markdown block or raw)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Failed to parse JSON from response:", responseContent);
        }
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
      flaggedPOIs: parsed.flaggedPOIs || []
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
