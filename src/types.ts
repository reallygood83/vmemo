/**
 * VMemo Type Definitions
 * Core interfaces for the voice recording and transcription plugin
 */

// ============================================
// Settings Interfaces
// ============================================

export type AIProviderType = 'anthropic' | 'openai' | 'google' | 'xai';
export type AudioFormatType = 'wav' | 'webm' | 'mp3';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface VMemoSettings {
  // Storage Settings
  recordingFolder: string;
  keepAudioFiles: boolean;
  audioFormat: AudioFormatType;

  // Transcription Settings
  voxmlxPath: string;
  voxmlxModel: string;
  transcriptionLanguage: string;

  // AI Processing Settings
  aiProvider: AIProviderType;
  autoFormat: boolean;
  
  // Provider API Keys and Models
  anthropicKey: string;
  anthropicModel: string;
  openaiKey: string;
  openaiModel: string;
  googleKey: string;
  googleModel: string;
  xaiKey: string;
  xaiModel: string;

  // Template Settings
  defaultTemplate: string;
  customTemplates: Record<string, CustomTemplate>;

  // Advanced Settings
  maxRecordingDuration: number; // in minutes
  showNotifications: boolean;
  debugMode: boolean;
}

export interface CustomTemplate {
  name: string;
  description: string;
  content: string;
  systemPrompt?: string;
}

// ============================================
// Recording Interfaces
// ============================================

export type RecordingStatus = 'idle' | 'recording' | 'processing' | 'transcribing' | 'formatting' | 'complete' | 'error';

export interface RecordingState {
  status: RecordingStatus;
  startTime: number | null;
  duration: number;
  audioBlob: Blob | null;
  audioPath: string | null;
  error: string | null;
}

export interface RecordingMetadata {
  id: string;
  filename: string;
  createdAt: Date;
  duration: number;
  fileSize: number;
  format: AudioFormatType;
  sampleRate: number;
  channels: number;
}

// ============================================
// Transcription Interfaces
// ============================================

export interface TranscriptionSegment {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  speakerCount: number;
  segments: TranscriptionSegment[];
  metadata: TranscriptionMetadata;
}

export interface TranscriptionMetadata {
  model: string;
  processingTime: number;
  audioPath: string;
  timestamp: Date;
}

// ============================================
// AI Formatting Interfaces
// ============================================

export interface FormattedDocument {
  content: string;
  title: string;
  summary?: string;
  actionItems?: string[];
  decisions?: string[];
  metadata: FormattingMetadata;
}

export interface FormattingMetadata {
  provider: AIProviderType;
  model: string;
  template: string;
  tokensUsed?: number;
  processingTime: number;
}

export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  metadata?: Record<string, unknown>;
}

// ============================================
// Template Interfaces
// ============================================

export interface TemplateVariables {
  date: string;
  time: string;
  datetime: string;
  title: string;
  duration: string;
  audioPath: string;
  transcriptPath: string;
  speakerCount: number;
  language: string;
  content: string;
  summary?: string;
  customFields: Record<string, string>;
}

export interface BuiltInTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
  systemPrompt: string;
}

// ============================================
// Event Interfaces
// ============================================

export interface VMemoEvents {
  'recording:started': { startTime: number };
  'recording:stopped': { duration: number; audioBlob: Blob };
  'recording:error': { error: Error };
  'transcription:started': { audioPath: string };
  'transcription:progress': { progress: number };
  'transcription:complete': { result: TranscriptionResult };
  'transcription:error': { error: Error };
  'formatting:started': { provider: AIProviderType };
  'formatting:complete': { document: FormattedDocument };
  'formatting:error': { error: Error };
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ProcessingProgress {
  stage: 'recording' | 'saving' | 'transcribing' | 'formatting' | 'complete';
  progress: number; // 0-100
  message: string;
}
