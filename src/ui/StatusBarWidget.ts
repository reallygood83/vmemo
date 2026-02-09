import type VMemoPlugin from '../main';
import { UI_CONSTANTS } from '../constants';

export class StatusBarWidget {
  private plugin: VMemoPlugin;
  private statusBarEl: HTMLElement;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.statusBarEl = plugin.addStatusBarItem();
    this.statusBarEl.addClass(UI_CONSTANTS.statusBarClass);
    this.hide();
  }

  updateTime(durationMs: number): void {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    this.statusBarEl.setText(`🔴 Recording ${timeString}`);
    this.show();
  }

  updateStatus(message: string): void {
    this.statusBarEl.setText(message);
    this.show();
  }

  show(): void {
    this.statusBarEl.style.display = 'inline-block';
  }

  hide(): void {
    this.statusBarEl.style.display = 'none';
    this.statusBarEl.setText('');
  }
}
