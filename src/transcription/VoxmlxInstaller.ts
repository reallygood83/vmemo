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
    const pythonCommands = ['python3.11', 'python3', 'python'];
    
    for (const cmd of pythonCommands) {
      try {
        const { stdout } = await execAsync(`${cmd} --version`);
        const version = stdout.match(/Python (\d+)\.(\d+)/);
        
        if (version) {
          const major = parseInt(version[1]);
          const minor = parseInt(version[2]);
          
          if (major >= 3 && minor >= 8) {
            return;
          }
        }
      } catch {
        continue;
      }
    }
    
    throw new Error('Python 3.8+ is required. Please install Python from python.org');
  }

  private async installVoxmlx(): Promise<void> {
    const installCommands = [
      'pipx install voxmlx --python python3.11',
      'pipx install voxmlx --python python3',
      'pip3 install voxmlx',
      'pip install voxmlx',
    ];

    let lastError: Error | null = null;

    for (const cmd of installCommands) {
      try {
        await execAsync(cmd, { timeout: 300000 });
        
        const isNowInstalled = await this.checkInstallation();
        if (isNowInstalled) {
          return;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw lastError || new Error(ERROR_MESSAGES.voxmlxInstallFailed);
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
