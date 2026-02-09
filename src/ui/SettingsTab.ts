import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';
import type VMemoPlugin from '../main';
import { AIProviderType } from '../types';
import { AI_MODELS, BUILT_IN_TEMPLATES } from '../constants';

const execAsync = promisify(exec);

export class VMemoSettingsTab extends PluginSettingTab {
  plugin: VMemoPlugin;
  private voxmlxStatusEl: HTMLElement | null = null;

  constructor(app: App, plugin: VMemoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'VMemo Settings' });

    this.addVoxmlxSection(containerEl);
    this.addStorageSettings(containerEl);
    this.addTranscriptionSettings(containerEl);
    this.addAISettings(containerEl);
    this.addTemplateSettings(containerEl);
    this.addAdvancedSettings(containerEl);
  }

  private async addVoxmlxSection(containerEl: HTMLElement): Promise<void> {
    containerEl.createEl('h2', { text: 'Transcription Engine (voxmlx)' });

    const statusContainer = containerEl.createDiv({ cls: 'vmemo-voxmlx-status' });
    this.voxmlxStatusEl = statusContainer.createDiv({ cls: 'vmemo-status-text' });
    
    await this.checkVoxmlxStatus();

    const installCmd = 'pipx install voxmlx';

    new Setting(containerEl)
      .setName('Install voxmlx')
      .setDesc('One-click install via Terminal (auto-runs the command)')
      .addButton(button => button
        .setButtonText('Install Now')
        .setCta()
        .onClick(async () => {
          new Notice('Opening Terminal and running install command...', 3000);
          const script = `tell application "Terminal"
            activate
            do script "${installCmd}"
          end tell`;
          await execAsync(`osascript -e '${script}'`);
        }))
      .addButton(button => button
        .setButtonText('Check Status')
        .onClick(async () => {
          await this.checkVoxmlxStatus();
          new Notice(await this.verifyVoxmlxInstalled() ? 'voxmlx is installed!' : 'voxmlx not found');
        }));

    const infoEl = containerEl.createDiv({ cls: 'vmemo-manual-install' });
    infoEl.createEl('p', { 
      text: 'Requirements: macOS with Apple Silicon (M1/M2/M3/M4)',
      cls: 'vmemo-manual-label'
    });
    
    infoEl.createEl('p', { text: 'Install command:', cls: 'vmemo-manual-label' });
    infoEl.createEl('code', { text: installCmd, cls: 'vmemo-manual-command' });
    
    const copyBtn = infoEl.createEl('button', { text: 'Copy', cls: 'vmemo-copy-btn' });
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(installCmd);
      new Notice('Copied!');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    };

    infoEl.createEl('p', { 
      text: 'If pipx is not installed: brew install pipx',
      cls: 'vmemo-manual-label vmemo-hint'
    });
  }

  private async checkVoxmlxStatus(): Promise<void> {
    if (!this.voxmlxStatusEl) return;

    const checkPaths = [
      'voxmlx --help',
      '~/.local/bin/voxmlx --help',
      '/opt/homebrew/bin/voxmlx --help',
    ];

    for (const cmd of checkPaths) {
      try {
        await execAsync(cmd);
        this.voxmlxStatusEl.innerHTML = '<span class="vmemo-status-ok">✅ Installed</span>';
        return;
      } catch {
        continue;
      }
    }

    const sysCheck = await this.checkSystemRequirements();
    if (!sysCheck.ok) {
      this.voxmlxStatusEl.innerHTML = `<span class="vmemo-status-error">❌ ${sysCheck.error?.split('\n')[0] || 'System requirements not met'}</span>`;
    } else {
      this.voxmlxStatusEl.innerHTML = '<span class="vmemo-status-error">❌ Not installed</span>';
    }
  }

  private async installVoxmlx(): Promise<void> {
    const sysCheck = await this.checkSystemRequirements();
    if (!sysCheck.ok) {
      throw new Error(sysCheck.error);
    }

    new Notice('Installing voxmlx... This may take 1-2 minutes.');

    const pythonPath = sysCheck.pythonPath;
    const homeDir = process.env.HOME || '/Users/' + process.env.USER;
    const envPath = `/opt/homebrew/bin:/usr/local/bin:${homeDir}/.local/bin:/usr/bin:/bin`;
    const execOptions = { 
      timeout: 300000,
      env: { ...process.env, PATH: envPath }
    };

    const installCommands = [
      { cmd: `/opt/homebrew/bin/pipx install voxmlx`, desc: 'pipx (homebrew)' },
      { cmd: `${pythonPath} -m pip install voxmlx --user --break-system-packages`, desc: 'pip (break-system)' },
      { cmd: `${pythonPath} -m pip install voxmlx --break-system-packages`, desc: 'pip (system)' },
    ];

    const errors: string[] = [];

    for (const { cmd, desc } of installCommands) {
      try {
        console.log(`VMemo: Trying ${desc}: ${cmd}`);
        await execAsync(cmd, execOptions);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (await this.verifyVoxmlxInstalled()) {
          new Notice('voxmlx installed successfully!');
          return;
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`VMemo: ${desc} failed:`, msg);
        
        if (msg.includes('No matching distribution') || msg.includes('from versions: none')) {
          errors.push(`${desc}: Package not found`);
        } else if (msg.includes('externally-managed-environment')) {
          errors.push(`${desc}: System Python restrictions`);
        } else if (msg.includes('command not found') || msg.includes('No such file')) {
          errors.push(`${desc}: Not installed`);
        } else {
          errors.push(`${desc}: ${msg.slice(0, 80)}`);
        }
        continue;
      }
    }

    const errorDetails = errors.join('\n');
    const hasPipxError = errors.some(e => e.includes('pipx') && e.includes('Not installed'));
    
    let manualCmd = `${pythonPath} -m pip install voxmlx --break-system-packages`;
    if (hasPipxError) {
      manualCmd = 'brew install pipx && pipx install voxmlx';
    }
    
    throw new Error(`Installation failed.\n\nRequirements:\n• macOS with Apple Silicon (M1/M2/M3/M4)\n• Python 3.10+ (Detected: ${sysCheck.version})\n• pipx (recommended)\n\nRun in Terminal:\n${manualCmd}\n\nErrors:\n${errorDetails}`);
  }

  private async checkSystemRequirements(): Promise<{ ok: boolean; pythonPath: string; version: string; error?: string }> {
    try {
      const { stdout: arch } = await execAsync('uname -m');
      if (!arch.trim().includes('arm64')) {
        return { 
          ok: false, 
          pythonPath: '', 
          version: '',
          error: 'voxmlx requires Apple Silicon (M1/M2/M3/M4).\nYour Mac appears to be Intel-based.\n\nAlternative: Use cloud transcription services instead.'
        };
      }
    } catch {
    }

    const pythonPaths = [
      '/opt/homebrew/bin/python3',
      '/opt/homebrew/bin/python3.12',
      '/opt/homebrew/bin/python3.11',
      '/opt/homebrew/bin/python3.10',
      '/usr/local/bin/python3',
      'python3',
    ];

    for (const pythonPath of pythonPaths) {
      try {
        const { stdout } = await execAsync(`${pythonPath} --version`);
        const versionMatch = stdout.match(/Python (\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          const version = `${major}.${minor}`;
          
          if (major >= 3 && minor >= 10) {
            console.log(`VMemo: Found suitable Python: ${pythonPath} (${version})`);
            return { ok: true, pythonPath, version };
          } else {
            console.log(`VMemo: Python ${version} at ${pythonPath} is too old (need >=3.10)`);
          }
        }
      } catch {
        continue;
      }
    }

    return {
      ok: false,
      pythonPath: '',
      version: '',
      error: 'No suitable Python found.\n\nvoxmlx requires Python 3.10 or higher.\n\nInstall with Homebrew:\nbrew install python@3.12\n\nThen try again.'
    };
  }

  private async verifyVoxmlxInstalled(): Promise<boolean> {
    const checkPaths = [
      'voxmlx --help',
      '~/.local/bin/voxmlx --help',
      '/opt/homebrew/bin/voxmlx --help',
    ];

    for (const cmd of checkPaths) {
      try {
        await execAsync(cmd);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  private addStorageSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'Storage' });

    new Setting(containerEl)
      .setName('Recording folder')
      .setDesc('Folder to save recordings and transcripts')
      .addText(text => text
        .setPlaceholder('vmemo-recordings')
        .setValue(this.plugin.settings.recordingFolder)
        .onChange(async (value) => {
          this.plugin.settings.recordingFolder = value || 'vmemo-recordings';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Keep audio files')
      .setDesc('Keep original audio files after transcription')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.keepAudioFiles)
        .onChange(async (value) => {
          this.plugin.settings.keepAudioFiles = value;
          await this.plugin.saveSettings();
        }));
  }

  private addTranscriptionSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'Transcription Options' });

    new Setting(containerEl)
      .setName('voxmlx path')
      .setDesc('Custom path to voxmlx executable (leave empty for auto-detect)')
      .addText(text => text
        .setPlaceholder('Auto-detect')
        .setValue(this.plugin.settings.voxmlxPath)
        .onChange(async (value) => {
          this.plugin.settings.voxmlxPath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Language')
      .setDesc('Transcription language (auto for automatic detection)')
      .addDropdown(dropdown => dropdown
        .addOption('auto', 'Auto-detect')
        .addOption('en', 'English')
        .addOption('ko', 'Korean')
        .addOption('ja', 'Japanese')
        .addOption('zh', 'Chinese')
        .addOption('es', 'Spanish')
        .addOption('fr', 'French')
        .addOption('de', 'German')
        .setValue(this.plugin.settings.transcriptionLanguage)
        .onChange(async (value) => {
          this.plugin.settings.transcriptionLanguage = value;
          await this.plugin.saveSettings();
        }));
  }

  private addAISettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'AI Formatting' });

    new Setting(containerEl)
      .setName('Auto-format after transcription')
      .setDesc('Automatically format transcripts with AI')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoFormat)
        .onChange(async (value) => {
          this.plugin.settings.autoFormat = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('AI Provider')
      .setDesc('Select the AI provider for formatting')
      .addDropdown(dropdown => {
        const providers: AIProviderType[] = ['anthropic', 'openai', 'google', 'xai'];
        providers.forEach(provider => {
          dropdown.addOption(provider, AI_MODELS[provider].name);
        });
        dropdown
          .setValue(this.plugin.settings.aiProvider)
          .onChange(async (value: AIProviderType) => {
            this.plugin.settings.aiProvider = value;
            await this.plugin.saveSettings();
          });
      });

    containerEl.createEl('h3', { text: 'API Keys' });

    new Setting(containerEl)
      .setName('Anthropic API Key')
      .setDesc('Your Claude API key')
      .addText(text => text
        .setPlaceholder('sk-ant-...')
        .setValue(this.plugin.settings.anthropicKey)
        .onChange(async (value) => {
          this.plugin.settings.anthropicKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Anthropic Model')
      .setDesc('Claude model to use')
      .addText(text => text
        .setPlaceholder(AI_MODELS.anthropic.model)
        .setValue(this.plugin.settings.anthropicModel)
        .onChange(async (value) => {
          this.plugin.settings.anthropicModel = value || AI_MODELS.anthropic.model;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('OpenAI API Key')
      .setDesc('Your OpenAI API key')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.openaiKey)
        .onChange(async (value) => {
          this.plugin.settings.openaiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('OpenAI Model')
      .setDesc('GPT model to use')
      .addText(text => text
        .setPlaceholder(AI_MODELS.openai.model)
        .setValue(this.plugin.settings.openaiModel)
        .onChange(async (value) => {
          this.plugin.settings.openaiModel = value || AI_MODELS.openai.model;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Google API Key')
      .setDesc('Your Google AI API key')
      .addText(text => text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.googleKey)
        .onChange(async (value) => {
          this.plugin.settings.googleKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Google Model')
      .setDesc('Gemini model to use')
      .addText(text => text
        .setPlaceholder(AI_MODELS.google.model)
        .setValue(this.plugin.settings.googleModel)
        .onChange(async (value) => {
          this.plugin.settings.googleModel = value || AI_MODELS.google.model;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('xAI API Key')
      .setDesc('Your xAI (Grok) API key')
      .addText(text => text
        .setPlaceholder('...')
        .setValue(this.plugin.settings.xaiKey)
        .onChange(async (value) => {
          this.plugin.settings.xaiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('xAI Model')
      .setDesc('Grok model to use')
      .addText(text => text
        .setPlaceholder(AI_MODELS.xai.model)
        .setValue(this.plugin.settings.xaiModel)
        .onChange(async (value) => {
          this.plugin.settings.xaiModel = value || AI_MODELS.xai.model;
          await this.plugin.saveSettings();
        }));
  }

  private addTemplateSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'Templates' });

    new Setting(containerEl)
      .setName('Default template')
      .setDesc('Template to use for new transcripts')
      .addDropdown(dropdown => {
        Object.entries(BUILT_IN_TEMPLATES).forEach(([id, template]) => {
          dropdown.addOption(id, template.name);
        });
        
        Object.keys(this.plugin.settings.customTemplates).forEach(name => {
          dropdown.addOption(name, name);
        });
        
        dropdown
          .setValue(this.plugin.settings.defaultTemplate)
          .onChange(async (value) => {
            this.plugin.settings.defaultTemplate = value;
            await this.plugin.saveSettings();
          });
      });
  }

  private addAdvancedSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h2', { text: 'Advanced' });

    new Setting(containerEl)
      .setName('Maximum recording duration')
      .setDesc('Maximum recording length in minutes (1-480)')
      .addText(text => text
        .setPlaceholder('120')
        .setValue(String(this.plugin.settings.maxRecordingDuration))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num >= 1 && num <= 480) {
            this.plugin.settings.maxRecordingDuration = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Show notifications')
      .setDesc('Display notifications for recording events')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showNotifications)
        .onChange(async (value) => {
          this.plugin.settings.showNotifications = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Enable debug logging')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.debugMode)
        .onChange(async (value) => {
          this.plugin.settings.debugMode = value;
          await this.plugin.saveSettings();
        }));
  }
}
