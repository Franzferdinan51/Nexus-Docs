
export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  images: string[];
  analysis?: DocumentAnalysis;
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'error';
  isPOI?: boolean;
  lineage?: string[]; // Tracks which models were used
  contentBlob?: Blob; // Added for IDB storage reference
}

export interface Entity {
  name: string;
  role: string;
  context: string;
  isFamous?: boolean;
}

export interface DocumentAnalysis {
  summary: string;
  entities: Entity[];
  keyInsights: string[];
  sentiment: string;
  documentDate?: string;
  flaggedPOIs: string[];
  processedBy?: string;
  locations?: string[]; // New: Places mentioned
  organizations?: string[]; // New: Companies/Groups
  visualObjects?: string[]; // New: Objects found in images
  evidenceType?: string; // New: e.g., "Financial Record", "Email", "Photo"
}

export interface POI {
  id: string;
  name: string;
  mentions: { docId: string; docName: string; context: string }[];
  isPolitical?: boolean;
  image?: string;
}

export interface ModelConfig {
  priority: ('gemini' | 'openrouter' | 'lmstudio' | 'lmstudio2')[];
  enabled: {
    gemini: boolean;
    openrouter: boolean;
    lmstudio: boolean;
    lmstudio2: boolean;
  };
  geminiKey: string;
  geminiModel: string;
  openRouterModel: string;
  openRouterKey: string;
  lmStudioEndpoint: string;
  lmStudioModel: string;
  lmStudioEndpoint2: string;
  lmStudioModel2: string;
  dualCheckMode: boolean; // Enable cross-verification
  preferredVerifier: 'auto' | 'gemini' | 'openrouter' | 'lmstudio' | 'lmstudio2';
  parallelAnalysis: boolean; // Enable parallel execution
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  references?: string[];
}

export interface AppState {
  documents: ProcessedDocument[];
  pois: POI[];
  selectedDocId: string | null;
  isProcessing: boolean;
  view: 'dashboard' | 'documents' | 'analytics' | 'pois' | 'chat' | 'settings' | 'document_detail';
  config: ModelConfig;
  chatHistory: ChatMessage[];
  processingQueue: string[];
}
