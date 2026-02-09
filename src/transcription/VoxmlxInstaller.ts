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
      const pythonPath = await this.findPython();
      await this.installVoxmlx(pythonPath);
      new Notice('voxmlx installed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.voxmlxInstallFailed;
      new Notice(`Installation failed: ${message}`, 10000);
      throw error;
    }
  }

  private async findPython(): Promise<string> {
    const pythonPaths = [
      '/opt/homebrew/bin/python3',
      '/usr/local/bin/python3',
      '/usr/bin/python3',
      'python3',
      'python',
    ];
    
    for (const pythonPath of pythonPaths) {
      try {
        const { stdout } = await execAsync(`${pythonPath} --version`);
        const version = stdout.match(/Python (\d+)\.(\d+)/);
        
        if (version) {
          const major = parseInt(version[1]);
          const minor = parseInt(version[2]);
          
          if (major >= 3 && minor >= 8) {
            return pythonPath;
          }
        }
      } catch {
        continue;
      }
    }
    
    throw new Error('Python 3.8+ is required. Please install Python from python.org');
  }

  private async installVoxmlx(pythonPath: string): Promise<void> {
    const installCommands = [
      `${pythonPath} -m pip install voxmlx --user`,
      `${pythonPath} -m pip install voxmlx`,
      '/opt/homebrew/bin/pip3 install voxmlx',
      '/usr/local/bin/pip3 install voxmlx',
    ];

    let lastError: Error | null = null;

    for (const cmd of installCommands) {
      try {
        console.log('VMemo: Trying install command:', cmd);
        await execAsync(cmd, { timeout: 300000 });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const isNowInstalled = await this.checkInstallation();
        if (isNowInstalled) {
          console.log('VMemo: voxmlx installed successfully');
          return;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log('VMemo: Install command failed:', cmd, lastError.message);
        continue;
      }
    }

    throw new Error(`Failed to install voxmlx. Please run manually:\n${installCommands[0]}`);
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
