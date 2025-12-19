
export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  content: string; // Text content
  images: string[]; // Base64 images extracted
  analysis?: DocumentAnalysis;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface DocumentAnalysis {
  summary: string;
  entities: {
    name: string;
    role: string;
    context: string;
  }[];
  keyInsights: string[];
  sentiment: string;
  documentDate?: string;
}

export interface AppState {
  documents: ProcessedDocument[];
  selectedDocId: string | null;
  isProcessing: boolean;
  view: 'dashboard' | 'document' | 'analytics';
}
