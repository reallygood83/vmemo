import { Modal, App } from 'obsidian';

type ProcessingStage = 'recording' | 'saving' | 'transcribing' | 'formatting' | 'complete' | 'error';

export class ProcessingModal extends Modal {
  private stage: ProcessingStage = 'recording';
  private duration = 0;
  private message = '';
  private errorMessage = '';
  private timerInterval: NodeJS.Timeout | null = null;
  private startTime = 0;
  
  private modalContent!: HTMLElement;
  private iconEl!: HTMLElement;
  private stageTitleEl!: HTMLElement;
  private timerEl!: HTMLElement;
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
    this.timerEl = this.modalContent.createDiv({ cls: 'vmemo-modal-timer' });
    this.messageEl = this.modalContent.createDiv({ cls: 'vmemo-modal-message' });
    this.progressEl = this.modalContent.createDiv({ cls: 'vmemo-modal-progress' });
    this.buttonContainerEl = this.modalContent.createDiv({ cls: 'vmemo-modal-buttons' });

    this.updateDisplay();
  }

  onClose(): void {
    this.stopTimer();
    const { contentEl } = this;
    contentEl.empty();
  }

  startRecording(): void {
    this.stage = 'recording';
    this.startTime = Date.now();
    this.startTimer();
    this.updateDisplay();
  }

  setStage(stage: ProcessingStage, message?: string): void {
    this.stage = stage;
    if (message) {
      this.message = message;
    }
    if (stage !== 'recording') {
      this.stopTimer();
    }
    this.updateDisplay();
  }

  setError(errorMessage: string): void {
    this.stage = 'error';
    this.errorMessage = errorMessage;
    this.stopTimer();
    this.updateDisplay();
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.duration = Date.now() - this.startTime;
      this.updateTimerDisplay();
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplay(): void {
    if (this.timerEl) {
      this.timerEl.setText(this.formatDuration(this.duration));
    }
  }

  private updateDisplay(): void {
    if (!this.modalContent) return;

    const config = this.getStageConfig();
    
    this.iconEl.empty();
    this.iconEl.setText(config.icon);
    this.iconEl.className = `vmemo-modal-icon ${config.iconClass}`;
    
    this.stageTitleEl.setText(config.title);
    
    if (this.stage === 'recording') {
      this.timerEl.style.display = 'block';
      this.timerEl.setText(this.formatDuration(this.duration));
    } else {
      this.timerEl.style.display = 'none';
    }
    
    this.messageEl.setText(config.message);
    
    if (config.showProgress) {
      this.progressEl.style.display = 'block';
      this.progressEl.innerHTML = '<div class="vmemo-progress-bar"><div class="vmemo-progress-bar-fill vmemo-progress-animated"></div></div>';
    } else {
      this.progressEl.style.display = 'none';
    }

    this.buttonContainerEl.empty();
    if (this.stage === 'recording') {
      const stopBtn = this.buttonContainerEl.createEl('button', { 
        text: 'Stop Recording',
        cls: 'vmemo-btn vmemo-btn-danger'
      });
      stopBtn.onclick = () => {
        this.onStopRecording?.();
      };
    } else if (this.stage === 'complete' || this.stage === 'error') {
      const closeBtn = this.buttonContainerEl.createEl('button', { 
        text: 'Close',
        cls: 'vmemo-btn'
      });
      closeBtn.onclick = () => this.close();
    }
  }

  private getStageConfig(): { icon: string; iconClass: string; title: string; message: string; showProgress: boolean } {
    switch (this.stage) {
      case 'recording':
        return {
          icon: '🔴',
          iconClass: 'recording',
          title: 'Recording...',
          message: 'Speak clearly into your microphone',
          showProgress: false,
        };
      case 'saving':
        return {
          icon: '💾',
          iconClass: 'saving',
          title: 'Saving Audio',
          message: 'Saving recording to vault...',
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

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }

  onStopRecording?: () => void;
}
