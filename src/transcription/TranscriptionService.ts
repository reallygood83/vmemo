import { exec } from 'child_process';
import { promisify } from 'util';
import { Notice } from 'obsidian';
import type VMemoPlugin from '../main';
import { VoxmlxInstaller } from './VoxmlxInstaller';
import { AudioConverter } from './AudioConverter';
import { TranscriptionResult } from '../types';

const execAsync = promisify(exec);

const HOME = process.env.HOME || `/Users/${process.env.USER}`;
const EXTENDED_PATH = `/opt/homebrew/bin:/usr/local/bin:${HOME}/.local/bin:/usr/bin:/bin`;

export class TranscriptionService {
  private plugin: VMemoPlugin;
  private installer: VoxmlxInstaller;
  private converter: AudioConverter;

  constructor(plugin: VMemoPlugin) {
    this.plugin = plugin;
    this.installer = new VoxmlxInstaller(plugin);
    this.converter = new AudioConverter();
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    await this.ensureVoxmlxInstalled();
    
    let finalAudioPath = audioPath;
    let convertedFilePath: string | null = null;
    
    if (await this.converter.needsConversion(audioPath)) {
      new Notice('Converting audio format for transcription...');
      const basePath = this.getBasePath();
      finalAudioPath = await this.converter.convertToWav(audioPath, basePath);
      convertedFilePath = finalAudioPath;
    }
    
    const absolutePath = this.getAbsolutePath(finalAudioPath);
    const startTime = Date.now();

    try {
      const result = await this.runVoxmlx(absolutePath);
      const processingTime = Date.now() - startTime;

      if (convertedFilePath) {
        await this.deleteConvertedFile(convertedFilePath);
      }

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
      if (convertedFilePath) {
        await this.deleteConvertedFile(convertedFilePath);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transcription failed: ${message}`);
    }
  }

  private async deleteConvertedFile(filePath: string): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      if (await adapter.exists(filePath)) {
        await adapter.remove(filePath);
      }
    } catch (error) {
      console.warn('Failed to delete converted file:', filePath, error);
    }
  }

  private async ensureVoxmlxInstalled(): Promise<void> {
    const isInstalled = await this.installer.checkInstallation();
    
    if (!isInstalled) {
      new Notice('voxmlx not found. Attempting to install...');
      await this.installer.install();
    }
  }

  private getBasePath(): string {
    return (this.plugin.app.vault.adapter as any).getBasePath?.() || '';
  }

  private getAbsolutePath(relativePath: string): string {
    return `${this.getBasePath()}/${relativePath}`;
  }

  private async runVoxmlx(audioPath: string): Promise<VoxmlxOutput> {
    const voxmlxPath = await this.installer.findVoxmlxPath();
    const command = `${voxmlxPath} --audio "${audioPath}"`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 600000,
        maxBuffer: 50 * 1024 * 1024,
        env: { ...process.env, PATH: EXTENDED_PATH },
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
