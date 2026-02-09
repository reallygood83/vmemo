/**
 * VMemo Constants
 * Default settings, AI models, and configuration values
 */

import { VMemoSettings, BuiltInTemplate, AIProviderType } from './types';

// ============================================
// Default Settings
// ============================================

export const DEFAULT_SETTINGS: VMemoSettings = {
  // Storage Settings
  recordingFolder: 'vmemo-recordings',
  keepAudioFiles: true,
  audioFormat: 'wav',

  // Transcription Settings
  voxmlxPath: '', // Auto-detect
  voxmlxModel: 'mlx-community/Voxtral-Mini-4B-6bit',
  transcriptionLanguage: 'auto',

  // AI Processing Settings
  aiProvider: 'anthropic',
  autoFormat: true,

  // Provider API Keys and Models (2026 latest models)
  anthropicKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',
  openaiKey: '',
  openaiModel: 'gpt-4.1',
  googleKey: '',
  googleModel: 'gemini-2.5-pro',
  xaiKey: '',
  xaiModel: 'grok-3',

  // Template Settings
  defaultTemplate: 'meeting-notes',
  customTemplates: {},

  // Advanced Settings
  maxRecordingDuration: 120, // 2 hours
  showNotifications: true,
  debugMode: false,
};

// ============================================
// AI Models Configuration
// ============================================

export const AI_MODELS: Record<AIProviderType, { model: string; name: string; endpoint: string; maxTokens: number }> = {
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    endpoint: 'https://api.anthropic.com/v1/messages',
    maxTokens: 8192,
  },
  openai: {
    model: 'gpt-4.1',
    name: 'GPT-4.1',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    maxTokens: 8192,
  },
  google: {
    model: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    maxTokens: 8192,
  },
  xai: {
    model: 'grok-3',
    name: 'Grok 3',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    maxTokens: 8192,
  },
};

// ============================================
// Audio Configuration
// ============================================

export const AUDIO_CONFIG = {
  sampleRate: 16000, // 16kHz - optimal for voxmlx
  channelCount: 1, // Mono
  bitDepth: 16,
  mimeType: 'audio/webm;codecs=opus', // Browser recording format
  targetFormat: 'wav', // Target format for voxmlx
  maxFileSizeMB: 500, // Maximum audio file size
};

// ============================================
// Transcription Configuration
// ============================================

export const TRANSCRIPTION_CONFIG = {
  voxmlxCommand: 'voxmlx',
  checkCommand: 'voxmlx --version',
  installCommand: 'pipx install voxmlx --python python3.11',
  pythonVersion: '3.11',
  supportedFormats: ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'webm'],
  defaultLanguage: 'auto',
};

// ============================================
// Built-in Templates
// ============================================

export const BUILT_IN_TEMPLATES: Record<string, BuiltInTemplate> = {
  'meeting-notes': {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting minutes with action items',
    icon: 'users',
    content: `# Meeting Notes: {{title}}

**Date**: {{date}}
**Time**: {{time}}
**Duration**: {{duration}}
**Participants**: {{speakerCount}} speakers

---

## Summary

{{summary}}

## Discussion Points

{{content}}

## Action Items

- [ ] 

## Decisions Made

- 

## Next Steps

- 

---

*Recorded with VMemo*
*Audio: [[{{audioPath}}]]*`,
    systemPrompt: `You are an expert meeting note formatter. Transform the transcript into well-structured meeting notes.

Your responsibilities:
1. Create a concise executive summary (2-3 sentences)
2. Organize discussion points by topic with clear headers
3. Extract and list all action items with assignees if mentioned
4. Identify and document key decisions made
5. Suggest logical next steps based on the discussion
6. Clean up filler words and verbal tics
7. Fix grammar and improve readability

Format with Markdown:
- Use ## for major sections
- Use ### for subsections
- Use bullet points for lists
- Use checkboxes for action items
- Bold important terms and names

Keep the original meaning and tone. Do not add information not present in the transcript.`,
  },

  'lecture-notes': {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    description: 'Educational content with key concepts and summaries',
    icon: 'graduation-cap',
    content: `# Lecture: {{title}}

**Date**: {{date}}
**Duration**: {{duration}}
**Subject**: 

---

## Key Concepts

{{summary}}

## Detailed Notes

{{content}}

## Important Terms

- 

## Questions to Review

- 

## Related Topics

- 

---

*Recorded with VMemo*
*Audio: [[{{audioPath}}]]*`,
    systemPrompt: `You are an expert educational content formatter. Transform the lecture transcript into comprehensive study notes.

Your responsibilities:
1. Identify and highlight key concepts and main ideas
2. Organize content into logical learning sections
3. Extract important terminology and definitions
4. Create review questions based on the content
5. Suggest related topics for further study
6. Clean up verbal fillers and improve readability
7. Preserve technical accuracy and nuance

Format with Markdown:
- Use ## for major topics
- Use ### for subtopics
- Use bullet points for lists
- Use **bold** for key terms
- Use > blockquotes for important quotes or definitions

Optimize for learning and review. Maintain academic rigor.`,
  },

  'interview': {
    id: 'interview',
    name: 'Interview Notes',
    description: 'Q&A format with candidate evaluation',
    icon: 'message-circle',
    content: `# Interview: {{title}}

**Date**: {{date}}
**Duration**: {{duration}}
**Participants**: {{speakerCount}}

---

## Overview

{{summary}}

## Questions & Answers

{{content}}

## Key Observations

- 

## Strengths

- 

## Areas for Follow-up

- 

## Overall Assessment

---

*Recorded with VMemo*
*Audio: [[{{audioPath}}]]*`,
    systemPrompt: `You are an expert interview documenter. Transform the interview transcript into structured Q&A notes.

Your responsibilities:
1. Clearly separate questions from answers
2. Identify the interviewer and interviewee
3. Highlight key responses and notable quotes
4. Note any follow-up questions or clarifications
5. Extract observable skills and qualities
6. Maintain objectivity and accuracy
7. Clean up filler words while preserving meaning

Format with Markdown:
- Use **Q:** and **A:** prefixes for dialogue
- Use ### for topic transitions
- Use bullet points for observations
- Use > blockquotes for notable responses

Preserve the authentic voice of the interviewee. Be objective and thorough.`,
  },

  'brainstorm': {
    id: 'brainstorm',
    name: 'Brainstorm Session',
    description: 'Ideas and creative concepts organized by theme',
    icon: 'lightbulb',
    content: `# Brainstorm: {{title}}

**Date**: {{date}}
**Duration**: {{duration}}
**Participants**: {{speakerCount}}

---

## Session Goal

{{summary}}

## Ideas Generated

{{content}}

## Top Ideas to Explore

1. 
2. 
3. 

## Action Items

- [ ] 

## Parking Lot (Future Ideas)

- 

---

*Recorded with VMemo*
*Audio: [[{{audioPath}}]]*`,
    systemPrompt: `You are an expert creative session facilitator. Transform the brainstorm transcript into organized idea documentation.

Your responsibilities:
1. Capture ALL ideas mentioned, even incomplete ones
2. Group related ideas by theme or category
3. Identify the most promising or frequently discussed ideas
4. Note any constraints or concerns raised
5. Extract action items for follow-up
6. Preserve creative energy and spontaneity
7. Clean up while maintaining idea essence

Format with Markdown:
- Use ## for idea categories
- Use numbered lists for ranked ideas
- Use bullet points for idea details
- Use 💡 emoji for breakthrough ideas
- Use ⚠️ for concerns or constraints

Capture the creative spirit. Every idea has potential value.`,
  },

  'journal': {
    id: 'journal',
    name: 'Voice Journal',
    description: 'Personal reflection and daily thoughts',
    icon: 'book-open',
    content: `# Journal Entry

**Date**: {{date}}
**Time**: {{time}}
**Duration**: {{duration}}

---

## Today's Thoughts

{{content}}

## Reflections

{{summary}}

## Gratitude

- 

## Tomorrow's Intentions

- 

---

*Voice journal powered by VMemo*`,
    systemPrompt: `You are a thoughtful journal assistant. Transform the voice journal into a reflective written entry.

Your responsibilities:
1. Preserve the personal, authentic voice
2. Organize thoughts into coherent paragraphs
3. Identify themes and patterns in the reflection
4. Extract any goals or intentions mentioned
5. Note any gratitude or positive observations
6. Gently improve readability without losing intimacy
7. Maintain privacy and sensitivity

Format with Markdown:
- Use flowing paragraphs for narrative sections
- Use bullet points for lists
- Use *italics* for inner thoughts
- Use > blockquotes for memorable realizations

This is personal writing. Preserve authenticity and emotional truth.`,
  },

  'raw': {
    id: 'raw',
    name: 'Raw Transcript',
    description: 'Unformatted transcript with minimal cleanup',
    icon: 'file-text',
    content: `# Transcript: {{title}}

**Date**: {{date}} {{time}}
**Duration**: {{duration}}
**Language**: {{language}}

---

{{content}}

---

*Transcribed with VMemo using voxmlx*
*Audio: [[{{audioPath}}]]*`,
    systemPrompt: `You are a transcript cleaner. Make minimal improvements to the raw transcript.

Your responsibilities:
1. Add proper punctuation and capitalization
2. Fix obvious speech recognition errors
3. Add paragraph breaks at natural pauses
4. Keep ALL content - do not summarize or remove anything
5. Do not add headers or structure
6. Do not interpret or expand on content

Output the cleaned transcript as continuous text with paragraph breaks.
This should remain as close to verbatim as possible.`,
  },
};

// ============================================
// UI Constants
// ============================================

export const UI_CONSTANTS = {
  statusBarUpdateInterval: 1000, // 1 second
  notificationDuration: 5000, // 5 seconds
  progressUpdateInterval: 500, // 500ms
  ribbonIconId: 'vmemo-ribbon-icon',
  statusBarClass: 'vmemo-status-bar',
};

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  // Recording errors
  microphonePermissionDenied: 'Microphone access denied. Please allow microphone permission in your browser settings.',
  noMicrophoneFound: 'No microphone found. Please connect an audio input device.',
  recordingFailed: 'Recording failed. Please try again.',
  maxDurationReached: 'Maximum recording duration reached.',

  // Transcription errors
  voxmlxNotInstalled: 'voxmlx is not installed. Would you like to install it now?',
  voxmlxInstallFailed: 'Failed to install voxmlx. Please install manually: pipx install voxmlx --python python3.11',
  pythonNotFound: 'Python 3.11+ not found. Please install Python first.',
  transcriptionFailed: 'Transcription failed. Please check the audio file and try again.',

  // AI errors
  apiKeyMissing: (provider: string) => `${provider} API key not configured. Please add your API key in settings.`,
  apiRequestFailed: (provider: string) => `${provider} API request failed. Please check your API key and try again.`,
  rateLimitExceeded: 'API rate limit exceeded. Please wait a moment and try again.',

  // File errors
  fileNotFound: 'File not found.',
  fileReadError: 'Failed to read file.',
  fileWriteError: 'Failed to write file.',
  invalidAudioFormat: 'Invalid audio format. Supported formats: WAV, MP3, M4A, FLAC, OGG, WebM.',
};

// ============================================
// Plugin Info
// ============================================

export const PLUGIN_INFO = {
  id: 'vmemo',
  name: 'VMemo',
  version: '1.0.0',
  author: 'reallygood83',
  description: 'Voice recording, transcription, and AI-powered document formatting for Obsidian',
  repo: 'https://github.com/reallygood83/vmemo',
};
