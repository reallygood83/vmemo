import { Modal, App } from 'obsidian';

type ProcessingStage = 'saving' | 'transcribing' | 'formatting' | 'complete' | 'error';

export class ProcessingModal extends Modal {
  private stage: ProcessingStage = 'saving';
  private message = '';
  private errorMessage = '';
  
  private modalContent!: HTMLElement;
  private iconEl!: HTMLElement;
  private stageTitleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private progressEl!: HTMLElement;
  private buttonContainerEl!: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vmemo-processing-modal');

    this.modalContent = contentEl.createDiv({ cls: 'vmemo-modal-container' });
    
    this.iconEl = this.modalContent.createDiv({ cls: 'vmemo-modal-icon' });
    this.stageTitleEl = this.modalContent.createEl('h2', { cls: 'vmemo-modal-title' });
    this.messageEl = this.modalContent.createDiv({ cls: 'vmemo-modal-message' });
    this.progressEl = this.modalContent.createDiv({ cls: 'vmemo-modal-progress' });
    this.buttonContainerEl = this.modalContent.createDiv({ cls: 'vmemo-modal-buttons' });

    this.updateDisplay();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  setStage(stage: ProcessingStage, message?: string): void {
    this.stage = stage;
    if (message) {
      this.message = message;
    }
    this.updateDisplay();
  }

  setError(errorMessage: string): void {
    this.stage = 'error';
    this.errorMessage = errorMessage;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.modalContent) return;

    const config = this.getStageConfig();
    
    this.iconEl.empty();
    this.iconEl.setText(config.icon);
    this.iconEl.className = `vmemo-modal-icon ${config.iconClass}`;
    
    this.stageTitleEl.setText(config.title);
    this.messageEl.setText(config.message);
    
    if (config.showProgress) {
      this.progressEl.style.display = 'block';
      this.progressEl.innerHTML = '<div class="vmemo-progress-bar"><div class="vmemo-progress-bar-fill vmemo-progress-animated"></div></div>';
    } else {
      this.progressEl.style.display = 'none';
    }

    this.buttonContainerEl.empty();
    if (this.stage === 'complete' || this.stage === 'error') {
      const closeBtn = this.buttonContainerEl.createEl('button', { 
        text: 'Close',
        cls: 'vmemo-btn'
      });
      closeBtn.onclick = () => this.close();
    }
  }

  private getStageConfig(): { icon: string; iconClass: string; title: string; message: string; showProgress: boolean } {
    switch (this.stage) {
      case 'saving':
        return {
          icon: '💾',
          iconClass: 'saving',
          title: 'Saving Audio',
          message: this.message || 'Saving recording to vault...',
          showProgress: true,
        };
      case 'transcribing':
        return {
          icon: '🎙️',
          iconClass: 'transcribing',
          title: 'Transcribing',
          message: this.message || 'Converting speech to text with voxmlx...',
          showProgress: true,
        };
      case 'formatting':
        return {
          icon: '🤖',
          iconClass: 'formatting',
          title: 'AI Formatting',
          message: this.message || 'Formatting transcript with AI...',
          showProgress: true,
        };
      case 'complete':
        return {
          icon: '✅',
          iconClass: 'complete',
          title: 'Complete!',
          message: this.message || 'Your transcript has been saved.',
          showProgress: false,
        };
      case 'error':
        return {
          icon: '❌',
          iconClass: 'error',
          title: 'Error',
          message: this.errorMessage || 'An error occurred.',
          showProgress: false,
        };
      default:
        return {
          icon: '⏳',
          iconClass: '',
          title: 'Processing',
          message: 'Please wait...',
          showProgress: true,
        };
    }
  }
}
