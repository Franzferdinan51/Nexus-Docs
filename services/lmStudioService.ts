
import { DocumentAnalysis } from "../types";

/**
 * Tests connection to LM Studio by fetching available models.
 */
export async function testLMStudioConnection(endpoint: string): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
    return { success: response.ok };
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

export async function analyzeWithLMStudio(text: string, endpoint: string): Promise<DocumentAnalysis | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const baseUrl = endpoint.startsWith('http') ? endpoint : `http://${endpoint}`;
    const url = `${baseUrl}/v1/chat/completions`;

    const prompt = `
      TASK: ANALYZE DOCUMENT (LOCAL OSINT MODE)
      JSON OUTPUT ONLY.
      
      1. summary: A 2-sentence summary.
      2. entities: List of {name, role, context, isFamous(boolean)}.
      3. keyInsights: Array of strings.
      4. flaggedPOIs: Array of strings.
      
      DOCUMENT: ${text.substring(0, 5000)}
    `;

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "local-model",
        messages: [
          { role: "system", content: "You are a specialized OSINT document analyzer. You must output valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} - Check if LM Studio server is running and model is loaded.`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || "Summary extraction failed.",
      entities: parsed.entities || [],
      keyInsights: parsed.keyInsights || [],
      sentiment: "Neutral (Local)",
      documentDate: "Unknown",
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
