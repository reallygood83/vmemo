import { exec } from 'child_process';
import { promisify } from 'util';
import { Notice } from 'obsidian';
import type VMemoPlugin from '../main';
import { TRANSCRIPTION_CONFIG, ERROR_MESSAGES } from '../constants';

const execAsync = promisify(exec);

export class VoxmlxInstaller {
  private plugin: VMemoPlugin;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
  }

  async checkInstallation(): Promise<boolean> {
    try {
      const voxmlxPath = this.plugin.settings.voxmlxPath || TRANSCRIPTION_CONFIG.voxmlxCommand;
      await execAsync(`${voxmlxPath} --version`);
      return true;
    } catch {
      return false;
    }
  }

  async install(): Promise<void> {
    new Notice('Installing voxmlx... This may take a few minutes.');

    try {
      await this.checkPython();
      await this.installVoxmlx();
      new Notice('voxmlx installed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.voxmlxInstallFailed;
      new Notice(`Installation failed: ${message}`, 10000);
      throw error;
    }
  }

  private async checkPython(): Promise<void> {
    try {
      const { stdout } = await execAsync('python3 --version');
      const version = stdout.match(/Python (\d+)\.(\d+)/);
      
      if (!version) {
        throw new Error(ERROR_MESSAGES.pythonNotFound);
      }

      const major = parseInt(version[1]);
      const minor = parseInt(version[2]);

      if (major < 3 || (major === 3 && minor < 11)) {
        throw new Error('Python 3.11+ is required for voxmlx');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Python')) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.pythonNotFound);
    }
  }

  private async installVoxmlx(): Promise<void> {
    const { stdout, stderr } = await execAsync(TRANSCRIPTION_CONFIG.installCommand, {
      timeout: 300000, // 5 minute timeout
    });

    if (stderr && !stderr.includes('Successfully installed') && !stderr.includes('already installed')) {
      console.warn('voxmlx install stderr:', stderr);
    }

    const isNowInstalled = await this.checkInstallation();
    if (!isNowInstalled) {
      throw new Error(ERROR_MESSAGES.voxmlxInstallFailed);
    }
  }

  async getVersion(): Promise<string | null> {
    try {
      const voxmlxPath = this.plugin.settings.voxmlxPath || TRANSCRIPTION_CONFIG.voxmlxCommand;
      const { stdout } = await execAsync(`${voxmlxPath} --version`);
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
