import { Plugin, Notice } from 'obsidian';
import { VMemoSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { RecordingManager } from './core/RecordingManager';
import { RibbonIcon } from './ui/RibbonIcon';
import { StatusBarWidget } from './ui/StatusBarWidget';
import { VMemoSettingsTab } from './ui/SettingsTab';

export default class VMemoPlugin extends Plugin {
  settings: VMemoSettings = DEFAULT_SETTINGS;
  recordingManager!: RecordingManager;
  ribbonIcon!: RibbonIcon;
  statusBar!: StatusBarWidget;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.recordingManager = new RecordingManager(this);
    this.ribbonIcon = new RibbonIcon(this);
    this.statusBar = new StatusBarWidget(this);

    this.addSettingTab(new VMemoSettingsTab(this.app, this));

    this.addCommand({
      id: 'toggle-recording',
      name: 'Start/Stop Recording',
      callback: () => this.toggleRecording(),
    });

    this.addCommand({
      id: 'start-recording',
      name: 'Start Recording',
      callback: () => this.startRecording(),
    });

    this.addCommand({
      id: 'stop-recording',
      name: 'Stop Recording',
      callback: () => this.stopRecording(),
    });

    this.addCommand({
      id: 'upload-audio',
      name: 'Upload Audio File',
      callback: () => this.uploadAudio(),
    });

    if (this.settings.debugMode) {
      console.log('VMemo plugin loaded');
    }
  }

  async onunload(): Promise<void> {
    if (this.recordingManager?.isRecording()) {
      await this.recordingManager.stopRecording();
    }
    if (this.settings.debugMode) {
      console.log('VMemo plugin unloaded');
    }
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async toggleRecording(): Promise<void> {
    if (this.recordingManager.isRecording()) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    try {
      await this.recordingManager.startRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      new Notice(`Failed to start recording: ${message}`);
    }
  }

  private async stopRecording(): Promise<void> {
    try {
      await this.recordingManager.stopRecording();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      new Notice(`Failed to stop recording: ${message}`);
    }
  }

  private async uploadAudio(): Promise<void> {
    try {
      await this.recordingManager.uploadAudio();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      new Notice(`Failed to upload audio: ${message}`);
    }
  }

  notify(message: string, timeout?: number): void {
    if (this.settings.showNotifications) {
      new Notice(message, timeout);
    }
  }
}
