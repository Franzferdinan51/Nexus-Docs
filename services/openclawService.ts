/**
 * OpenClaw Service
 * Connects to OpenClaw Gateway for AI analysis using Bailian models
 */

import { DocumentAnalysis } from '../types';

const OPENCLAW_DEFAULT_ENDPOINT = 'http://localhost:18789';

export interface OpenClawConfig {
  endpoint: string;
  model: string;
}

/**
 * Analyze document using OpenClaw Gateway
 */
export async function analyzeWithOpenClaw(
  text: string,
  images: string[],
  config: OpenClawConfig,
  verificationTarget?: any,
  useSearch: boolean = false,
  mediaItem?: { mimeType: string; data: string }
): Promise<DocumentAnalysis> {
  const endpoint = config.endpoint || OPENCLAW_DEFAULT_ENDPOINT;
  
  // Build prompt for forensic analysis
  const systemPrompt = `TASK: PERFORM FORENSIC ANALYSIS OF THE PROVIDED DOCUMENT/TEXT.

CRITICAL INSTRUCTIONS:
- IDENTIFY: Recognize individuals, political figures, or known persons if mentioned
- INFER: Use context clues to deduce identities and relationships
- DESCRIBE: Provide specific details instead of generic labels
- READ: Extract all names, dates, locations, and key information
- FLAG: Identify high-priority individuals, risky behavior, or concerning content

Respond with a valid JSON object containing:
1. summary: Concise overview
2. entities: List of people found with context
3. keyInsights: Important findings and connections
4. flaggedPOIs: High-priority individuals
5. locations: Places mentioned
6. organizations: Groups/companies mentioned
7. timelineEvents: Chronological events with dates
8. confidenceScore: 0-100 certainty score`;

  const userContent = mediaItem 
    ? [
        { type: 'text', text: text || 'Analyze this image' },
        { type: 'image_url', image_url: { url: `data:${mediaItem.mimeType};base64,${mediaItem.data}` } }
      ]
    : [{ type: 'text', text: text || 'No text content available' }];

  try {
    // Try direct HTTP analysis endpoint first
    const response = await fetch(`${endpoint}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        model: config.model || 'bailian/qwen3.5-plus',
        max_tokens: 4000,
        temperature: 0.3
      })
    });

    if (response.ok) {
      const result = await response.json();
      return parseOpenClawResponse(result, config.model || 'openclaw');
    }

    // Fallback: Try sessions_spawn approach via gateway
    const spawnResponse = await fetch(`${endpoint}/api/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: `Analyze this forensic evidence and return JSON analysis: ${text.substring(0, 8000)}`,
        model: config.model || 'bailian/qwen3.5-plus',
        mode: 'run',
        timeout: 300
      })
    });

    if (spawnResponse.ok) {
      const spawnResult = await spawnResponse.json();
      return parseOpenClawResponse(spawnResult, config.model || 'openclaw');
    }

    // Final fallback: Return structured analysis from direct content
    return generateFallbackAnalysis(text, images, config.model || 'openclaw');

  } catch (error) {
    console.error('[OpenClaw] Analysis failed:', error);
    return generateFallbackAnalysis(text, images, config.model || 'openclaw');
  }
}

/**
 * Parse OpenClaw response into DocumentAnalysis format
 */
function parseOpenClawResponse(response: any, provider: string): DocumentAnalysis {
  const content = response.content || response.analysis || response.result || '';
  
  try {
    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || 'Analysis completed',
        entities: parsed.entities || [],
        keyInsights: parsed.keyInsights || [],
        flaggedPOIs: parsed.flaggedPOIs || [],
        locations: parsed.locations || [],
        organizations: parsed.organizations || [],
        timelineEvents: parsed.timelineEvents || [],
        confidenceScore: parsed.confidenceScore || 75,
        provider
      };
    }
  } catch (e) {
    // JSON parse failed, use fallback
  }

  // Return structured analysis from text
  return {
    summary: content.substring(0, 500) || 'OpenClaw analysis completed',
    entities: [],
    keyInsights: [content.substring(0, 200)],
    flaggedPOIs: [],
    locations: [],
    organizations: [],
    timelineEvents: [],
    confidenceScore: 70,
    provider
  };
}

/**
 * Generate fallback analysis when OpenClaw is unavailable
 */
function generateFallbackAnalysis(text: string, images: string[], provider: string): DocumentAnalysis {
  // Extract basic info from text
  const entities: any[] = [];
  const keyInsights: string[] = [];
  
  // Simple entity extraction (names, dates, etc.)
  const nameMatches = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
  const dateMatches = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || [];
  
  nameMatches.slice(0, 10).forEach(name => {
    entities.push({
      name,
      role: 'Person',
      context: 'Mentioned in document',
      isFamous: false
    });
  });

  if (dateMatches.length > 0) {
    keyInsights.push(`Found ${dateMatches.length} date references`);
  }

  if (images.length > 0 || provider.includes('vision')) {
    keyInsights.push('Visual content detected - requires vision-capable model');
  }

  return {
    summary: `OpenClaw analysis (fallback mode). Text length: ${text.length} chars. Images: ${images.length}.`,
    entities,
    keyInsights,
    flaggedPOIs: [],
    locations: [],
    organizations: [],
    timelineEvents: dateMatches.map(d => ({ date: d, event: 'Date reference found' })),
    confidenceScore: 60,
    provider
  };
}

/**
 * Test OpenClaw connection
 */
export async function testOpenClawConnection(endpoint: string): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      return { ok: true, message: 'OpenClaw Gateway connected' };
    }

    // Try alternative health endpoint
    const altResponse = await fetch(`${endpoint}/api/health`, {
      method: 'GET',
    });

    if (altResponse.ok) {
      return { ok: true, message: 'OpenClaw API connected' };
    }

    return { ok: false, message: 'OpenClaw Gateway not responding' };
  } catch (error) {
    return { ok: false, message: `Connection failed: ${error}` };
  }
}

/**
 * RAG Chat with OpenClaw
 */
export async function openClawRagChat(
  messages: any[],
  documents: any[],
  config: OpenClawConfig
): Promise<string> {
  const endpoint = config.endpoint || OPENCLAW_DEFAULT_ENDPOINT;
  
  try {
    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context: documents.map((d: any) => d.content || d.summary).join('\n\n'),
        model: config.model || 'bailian/qwen3.5-plus'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.content || result.response || 'No response';
    }

    return 'OpenClaw chat unavailable';
  } catch (error) {
    console.error('[OpenClaw RAG] Chat failed:', error);
    return 'OpenClaw chat connection failed';
  }
}
