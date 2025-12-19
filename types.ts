
export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  content: string; 
  images: string[]; 
  analysis?: DocumentAnalysis;
  status: 'pending' | 'processing' | 'completed' | 'error';
  isPOI?: boolean;
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
}

export interface POI {
  id: string;
  name: string;
  mentions: { docId: string; docName: string; context: string }[];
  isPolitical?: boolean;
  image?: string;
}

export interface ModelConfig {
  useGemini: boolean;
  useLMStudio: boolean;
  geminiModel: 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
  lmStudioEndpoint: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  // Optional list of source document names referenced in the response
  references?: string[];
}

export interface AppState {
  documents: ProcessedDocument[];
  pois: POI[];
  selectedDocId: string | null;
  isProcessing: boolean;
  view: 'dashboard' | 'documents' | 'analytics' | 'pois' | 'chat' | 'settings';
  config: ModelConfig;
  chatHistory: ChatMessage[];
  processingQueue: string[];
}