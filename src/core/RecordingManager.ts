import { Notice } from 'obsidian';
import type VMemoPlugin from '../main';
import { AudioRecorder } from './AudioRecorder';
import { TranscriptionService } from '../transcription/TranscriptionService';
import { AIFormatterService } from '../ai/AIFormatterService';
import { TemplateEngine } from '../templates/TemplateEngine';
import { ProcessingModal } from '../ui/modals/ProcessingModal';
import { RecordingState, TranscriptionResult, FormattedDocument } from '../types';
import { UI_CONSTANTS } from '../constants';

export class RecordingManager {
  private plugin: VMemoPlugin;
  private recorder: AudioRecorder;
  private transcriptionService: TranscriptionService;
  private aiFormatter: AIFormatterService;
  private templateEngine: TemplateEngine;
  private state: RecordingState;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private modal: ProcessingModal | null = null;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.recorder = new AudioRecorder();
    this.transcriptionService = new TranscriptionService(plugin);
    this.aiFormatter = new AIFormatterService(plugin);
    this.templateEngine = new TemplateEngine(plugin);
    this.state = this.getInitialState();
  }

  private getInitialState(): RecordingState {
    return {
      status: 'idle',
      startTime: null,
      duration: 0,
      audioBlob: null,
      audioPath: null,
      error: null,
    };
  }

  async startRecording(): Promise<void> {
    if (this.state.status === 'recording') {
      throw new Error('Recording already in progress');
    }

    await this.recorder.start();
    
    this.state = {
      ...this.getInitialState(),
      status: 'recording',
      startTime: Date.now(),
    };

    this.startTimer();
    this.plugin.ribbonIcon.setRecording(true);
    this.plugin.statusBar.updateStatus('🔴 Recording...');
    this.plugin.notify('Recording started - click mic icon to stop');
  }

  async stopRecording(): Promise<void> {
    if (this.state.status !== 'recording') {
      throw new Error('No recording in progress');
    }

    this.stopTimer();
    this.plugin.ribbonIcon.setRecording(false);
    this.plugin.statusBar.hide();

    this.modal = new ProcessingModal(this.plugin.app);
    this.modal.open();
    this.modal.setStage('saving', 'Saving audio file...');

    const audioBlob = await this.recorder.stop();
    this.state.audioBlob = audioBlob;
    this.state.status = 'processing';

    try {
      await this.processRecording(audioBlob);
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.modal) {
        this.modal.setError(this.state.error);
      }
      throw error;
    }
  }

  async uploadAudio(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

    return new Promise((resolve, reject) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        if (!file.type.startsWith('audio/')) {
          reject(new Error('Please select an audio file'));
          return;
        }

        this.modal = new ProcessingModal(this.plugin.app);
        this.modal.open();
        this.modal.setStage('saving', 'Processing uploaded file...');

        try {
          await this.processRecording(file);
          resolve();
        } catch (error) {
          if (this.modal) {
            this.modal.setError(error instanceof Error ? error.message : 'Unknown error');
          }
          reject(error);
        }
      };

      input.click();
    });
  }

  isRecording(): boolean {
    return this.state.status === 'recording';
  }

  getState(): RecordingState {
    return { ...this.state };
  }

  private async processRecording(audioBlob: Blob): Promise<void> {
    const audioPath = await this.saveAudioFile(audioBlob);
    this.state.audioPath = audioPath;

    this.state.status = 'transcribing';
    if (this.modal) {
      this.modal.setStage('transcribing', 'Converting speech to text with voxmlx...');
    }
    
    const transcription = await this.transcriptionService.transcribe(audioPath);

    let formattedContent: string;
    let formattedDoc: FormattedDocument | null = null;

    if (this.plugin.settings.autoFormat) {
      this.state.status = 'formatting';
      if (this.modal) {
        this.modal.setStage('formatting', 'Formatting transcript with AI...');
      }
      formattedDoc = await this.aiFormatter.format(transcription.text, this.plugin.settings.defaultTemplate);
      formattedContent = formattedDoc.content;
    } else {
      formattedContent = transcription.text;
    }

    const finalDocument = this.templateEngine.render({
      date: this.formatDate(new Date()),
      time: this.formatTime(new Date()),
      datetime: new Date().toISOString(),
      title: this.generateTitle(transcription),
      duration: this.formatDuration(transcription.duration),
      audioPath: audioPath,
      transcriptPath: '',
      speakerCount: transcription.speakerCount,
      language: transcription.language,
      content: formattedContent,
      summary: formattedDoc?.summary,
      customFields: {},
    });

    const transcriptPath = await this.saveTranscript(finalDocument);
    this.state.status = 'complete';

    if (this.modal) {
      this.modal.setStage('complete', `Saved to ${transcriptPath}`);
    }

    this.plugin.notify(`Transcript saved: ${transcriptPath}`);
    this.state = this.getInitialState();
  }

  private async saveAudioFile(blob: Blob): Promise<string> {
    const timestamp = this.getTimestamp();
    const extension = this.getExtensionFromBlob(blob);
    const filename = `recording-${timestamp}.${extension}`;
    const folder = this.plugin.settings.recordingFolder;
    const path = `${folder}/${filename}`;

    await this.ensureFolderExists(folder);

    const arrayBuffer = await blob.arrayBuffer();
    await this.plugin.app.vault.adapter.writeBinary(path, arrayBuffer);

    return path;
  }

  private async saveTranscript(content: string): Promise<string> {
    const timestamp = this.getTimestamp();
    const filename = `transcript-${timestamp}.md`;
    const folder = this.plugin.settings.recordingFolder;
    const path = `${folder}/${filename}`;

    await this.ensureFolderExists(folder);
    await this.plugin.app.vault.create(path, content);

    return path;
  }

  private async ensureFolderExists(folder: string): Promise<void> {
    const adapter = this.plugin.app.vault.adapter;
    if (!(await adapter.exists(folder))) {
      await adapter.mkdir(folder);
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.state.startTime) {
        this.state.duration = Date.now() - this.state.startTime;
        this.plugin.statusBar.updateTime(this.state.duration);

        const maxDurationMs = this.plugin.settings.maxRecordingDuration * 60 * 1000;
        if (this.state.duration >= maxDurationMs) {
          this.plugin.notify('Maximum recording duration reached');
          this.stopRecording();
        }
      }
    }, UI_CONSTANTS.statusBarUpdateInterval);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  private getExtensionFromBlob(blob: Blob): string {
    const typeMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
    };
    
    for (const [type, ext] of Object.entries(typeMap)) {
      if (blob.type.includes(type.split('/')[1])) {
        return ext;
      }
    }
    return 'webm';
  }

  private generateTitle(transcription: TranscriptionResult): string {
    const firstWords = transcription.text.split(/\s+/).slice(0, 5).join(' ');
    if (firstWords.length > 50) {
      return firstWords.slice(0, 47) + '...';
    }
    return firstWords || 'Untitled Recording';
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}
