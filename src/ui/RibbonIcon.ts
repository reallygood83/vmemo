import { setIcon } from 'obsidian';
import type VMemoPlugin from '../main';
import { UI_CONSTANTS } from '../constants';

export class RibbonIcon {
  private plugin: VMemoPlugin;
  private ribbonEl: HTMLElement;
  private isRecordingState = false;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.ribbonEl = plugin.addRibbonIcon(
      'microphone',
      'VMemo: Start/Stop Recording',
      () => this.handleClick()
    );
    this.ribbonEl.addClass(UI_CONSTANTS.ribbonIconId);
  }

  private async handleClick(): Promise<void> {
    if (this.plugin.recordingManager.isRecording()) {
      await this.plugin.recordingManager.stopRecording();
    } else {
      await this.plugin.recordingManager.startRecording();
    }
  }

  setRecording(isRecording: boolean): void {
    this.isRecordingState = isRecording;
    
    if (isRecording) {
      setIcon(this.ribbonEl, 'square');
      this.ribbonEl.addClass('vmemo-recording');
      this.ribbonEl.setAttribute('aria-label', 'VMemo: Stop Recording');
    } else {
      setIcon(this.ribbonEl, 'microphone');
      this.ribbonEl.removeClass('vmemo-recording');
      this.ribbonEl.setAttribute('aria-label', 'VMemo: Start Recording');
    }
  }

  isRecording(): boolean {
    return this.isRecordingState;
  }
}
