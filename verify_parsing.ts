
import { testLMStudioConnection, analyzeWithLMStudio } from './services/lmStudioService';

// Mock the parsing logic to test it in isolation
function textParser(responseContent: string) {
    // Clean the response
    let cleanedContent = responseContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Remove markdown code blocks if present
    const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        cleanedContent = codeBlockMatch[1].trim();
    }

    console.log("Cleaned content:", cleanedContent);

    // Try to extract JSON from the response
    let parsed: any = null;
    try {
        // Try direct parse first
        parsed = JSON.parse(cleanedContent);
    } catch (e) {
        console.log("Direct parse failed");
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
    }
    return parsed;
}

const testCase1 = `<think>Some thought process</think>
{
  "summary": "Valid JSON"
}`;

const testCase2 = `Some preamble
\`\`\`json
{
  "summary": "Markdown JSON"
}
\`\`\`
`;

console.log("Test Case 1:", textParser(testCase1));
console.log("Test Case 2:", textParser(testCase2));
