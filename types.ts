
export interface MethodDetail {
  name: string; // e.g., "PLSR"
  full_name: string; // e.g., "Partial Least Squares Regression"
  description: string; // Detailed explanation of how it works
}

export interface FigureDetail {
  label: string; // e.g., "Figure 1" or "Table 2"
  caption: string; // The text immediately under the figure
  description: string; // AI summary of what the data shows
  page_number: number; // The page number (1-based)
}

export interface MethodologyAnalysis {
  level_1_concept: string; // ELI5 / Conceptual
  level_2_process: string; // Technical Workflow
  level_3_technical: string; // Math / Deep Nuance
  key_methods: MethodDetail[]; // List of specific methods mentioned
}

export interface PaperAnalysis {
  title_en: string;
  title_cn: string;
  authors: string[];
  keywords: string[]; // New: Academic keywords
  summary_cn: string;
  conclusions: string[]; // List of bullet points
  methodology: MethodologyAnalysis;
  figures: FigureDetail[]; // New: Extracted figure/table info
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- New Types for Library & Notebook ---

export interface Highlight {
  id: string;
  paperId: string;
  paperTitle: string;
  text: string; // The selected text
  note: string; // User's remark
  createdAt: number;
  section?: string; // Context (e.g., "Abstract", "Methodology")
}

export interface StoredPaper {
  id: string;
  data: PaperAnalysis;
  uploadDate: number;
  folderId: string; // 'default' or custom folder ID
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
}