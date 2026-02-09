import { exec } from 'child_process';
import { promisify } from 'util';
import { Notice } from 'obsidian';
import type VMemoPlugin from '../main';
import { VoxmlxInstaller } from './VoxmlxInstaller';
import { TranscriptionResult } from '../types';
import { TRANSCRIPTION_CONFIG } from '../constants';

const execAsync = promisify(exec);

export class TranscriptionService {
  private plugin: VMemoPlugin;
  private installer: VoxmlxInstaller;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.installer = new VoxmlxInstaller(plugin);
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    await this.ensureVoxmlxInstalled();
    
    const absolutePath = this.getAbsolutePath(audioPath);
    const startTime = Date.now();

    try {
      const result = await this.runVoxmlx(absolutePath);
      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        duration: result.duration || 0,
        language: result.language || 'unknown',
        speakerCount: result.speakers?.length || 1,
        segments: result.segments || [],
        metadata: {
          model: this.plugin.settings.voxmlxModel,
          processingTime,
          audioPath,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transcription failed: ${message}`);
    }
  }

  private async ensureVoxmlxInstalled(): Promise<void> {
    const isInstalled = await this.installer.checkInstallation();
    
    if (!isInstalled) {
      new Notice('voxmlx not found. Attempting to install...');
      await this.installer.install();
    }
  }

  private getAbsolutePath(relativePath: string): string {
    const basePath = (this.plugin.app.vault.adapter as any).getBasePath?.() || '';
    return `${basePath}/${relativePath}`;
  }

  private async runVoxmlx(audioPath: string): Promise<VoxmlxOutput> {
    const voxmlxPath = this.plugin.settings.voxmlxPath || TRANSCRIPTION_CONFIG.voxmlxCommand;
    const command = `${voxmlxPath} --audio "${audioPath}"`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 600000, // 10 minute timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      });

      if (stderr && !stderr.includes('Loading') && !stderr.includes('Processing')) {
        console.warn('voxmlx stderr:', stderr);
      }

      return this.parseOutput(stdout);
    } catch (error) {
      if (error instanceof Error && error.message.includes('ETIMEDOUT')) {
        throw new Error('Transcription timed out. The audio file may be too long.');
      }
      throw error;
    }
  }

  private parseOutput(stdout: string): VoxmlxOutput {
    try {
      return JSON.parse(stdout);
    } catch {
      return {
        text: stdout.trim(),
        duration: 0,
        language: 'unknown',
        segments: [],
      };
    }
  }
}

interface VoxmlxOutput {
  text: string;
  duration?: number;
  language?: string;
  speakers?: string[];
  segments?: Array<{
    speaker: string;
    text: string;
    startTime: number;
    endTime: number;
  }>;
}
