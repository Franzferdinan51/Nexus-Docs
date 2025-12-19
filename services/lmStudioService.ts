
export async function analyzeWithLMStudio(text: string, endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "local-model",
        messages: [
          { role: "system", content: "You are an expert document analysis agent." },
          { role: "user", content: `Analyze this document briefly: ${text.substring(0, 5000)}` }
        ],
        temperature: 0.1
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("LM Studio Error:", error);
    return "LM Studio Offline";
  }
}
