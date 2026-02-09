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

    new Setting(containerEl)
      .setName('Install voxmlx')
      .setDesc('One-click installation of voxmlx transcription engine')
      .addButton(button => button
        .setButtonText('Install voxmlx')
        .setCta()
        .onClick(async () => {
          button.setDisabled(true);
          button.setButtonText('Installing...');
          
          try {
            await this.installVoxmlx();
            button.setButtonText('Installed!');
            await this.checkVoxmlxStatus();
          } catch (error) {
            button.setButtonText('Install voxmlx');
            const msg = error instanceof Error ? error.message : 'Unknown error';
            new Notice(`Installation failed: ${msg}`, 10000);
          } finally {
            button.setDisabled(false);
          }
        }))
      .addButton(button => button
        .setButtonText('Check Status')
        .onClick(async () => {
          await this.checkVoxmlxStatus();
        }));

    const manualInstallEl = containerEl.createDiv({ cls: 'vmemo-manual-install' });
    manualInstallEl.createEl('p', { 
      text: 'If automatic installation fails, run this command in Terminal:',
      cls: 'vmemo-manual-label'
    });
    
    const codeEl = manualInstallEl.createEl('code', { 
      text: '/opt/homebrew/bin/python3 -m pip install voxmlx',
      cls: 'vmemo-manual-command'
    });
    
    const copyBtn = manualInstallEl.createEl('button', {
      text: 'Copy',
      cls: 'vmemo-copy-btn'
    });
    copyBtn.onclick = () => {
      navigator.clipboard.writeText('/opt/homebrew/bin/python3 -m pip install voxmlx');
      new Notice('Command copied to clipboard!');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    };
  }

  private async checkVoxmlxStatus(): Promise<void> {
    if (!this.voxmlxStatusEl) return;

    try {
      const { stdout } = await execAsync('voxmlx --version');
      this.voxmlxStatusEl.innerHTML = `<span class="vmemo-status-ok">✅ Installed</span> <span class="vmemo-version">(${stdout.trim()})</span>`;
    } catch {
      try {
        const { stdout } = await execAsync('~/.local/bin/voxmlx --version');
        this.voxmlxStatusEl.innerHTML = `<span class="vmemo-status-ok">✅ Installed</span> <span class="vmemo-version">(${stdout.trim()})</span>`;
      } catch {
        this.voxmlxStatusEl.innerHTML = '<span class="vmemo-status-error">❌ Not installed</span>';
      }
    }
  }

  private async installVoxmlx(): Promise<void> {
    new Notice('Installing voxmlx... This may take 1-2 minutes.');

    const installCommands = [
      { cmd: '/opt/homebrew/bin/python3 -m pip install voxmlx --user --break-system-packages', desc: 'pip (user)' },
      { cmd: '/opt/homebrew/bin/python3 -m pip install voxmlx --break-system-packages', desc: 'pip (system)' },
      { cmd: '/usr/local/bin/python3 -m pip install voxmlx --user', desc: 'pip (local)' },
      { cmd: 'python3 -m pip install voxmlx --user', desc: 'pip (default)' },
    ];

    for (const { cmd, desc } of installCommands) {
      try {
        console.log(`VMemo: Trying ${desc}: ${cmd}`);
        await execAsync(cmd, { timeout: 300000 });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          await execAsync('voxmlx --version');
          new Notice('voxmlx installed successfully!');
          return;
        } catch {
          try {
            await execAsync('~/.local/bin/voxmlx --version');
            new Notice('voxmlx installed successfully!');
            return;
          } catch {
            continue;
          }
        }
      } catch (error) {
        console.log(`VMemo: ${desc} failed:`, error);
        continue;
      }
    }

    throw new Error('All installation methods failed. Please install manually.');
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
