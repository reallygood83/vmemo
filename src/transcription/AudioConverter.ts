import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const HOME = process.env.HOME || `/Users/${process.env.USER}`;
const EXTENDED_PATH = `/opt/homebrew/bin:/usr/local/bin:${HOME}/.local/bin:/usr/bin:/bin`;

export class AudioConverter {
  private getExecOptions(timeout = 120000) {
    return {
      timeout,
      env: { ...process.env, PATH: EXTENDED_PATH },
    };
  }

  async needsConversion(filePath: string): Promise<boolean> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const supportedByVoxmlx = ['wav', 'flac', 'mp3', 'ogg'];
    return !supportedByVoxmlx.includes(ext || '');
  }

  async convertToWav(inputPath: string, basePath: string): Promise<string> {
    const absoluteInput = `${basePath}/${inputPath}`;
    const outputPath = inputPath.replace(/\.[^.]+$/, '.wav');
    const absoluteOutput = `${basePath}/${outputPath}`;

    const command = `ffmpeg -y -i "${absoluteInput}" -ar 16000 -ac 1 -c:a pcm_s16le "${absoluteOutput}"`;
    
    try {
      await execAsync(command, this.getExecOptions());
      return outputPath;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('not found') || msg.includes('No such file')) {
        throw new Error('ffmpeg not found. Please install: brew install ffmpeg');
      }
      throw new Error(`Audio conversion failed: ${msg}`);
    }
  }

  async checkFfmpeg(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version', this.getExecOptions());
      return true;
    } catch {
      return false;
    }
  }
}
