# 🎙️ VMemo - Obsidian Voice Memo Plugin

> **macOS Apple Silicon (M1/M2/M3/M4) Only**

Voice recording with local AI transcription for Obsidian. Record your voice, get instant transcripts - all processed locally on your Mac.

[한국어 README](./README_KO.md)

## ✨ Features

- 🎤 **One-click Recording** - Start/stop with ribbon icon or hotkey
- 🔄 **Background Recording** - Keep working while recording
- ⏱️ **Live Timer** - See recording duration in status bar
- 🎙️ **100% Local Transcription** - Free, private, no internet required
- 🤖 **AI Formatting (Optional)** - Structure transcripts with Claude, GPT-4, Gemini, or Grok
- 📝 **Templates** - Meeting notes, lecture notes, journal, and more

## ⚠️ System Requirements

| Requirement | Details |
|-------------|---------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) **required** |
| **Python** | 3.10 or higher |
| **Obsidian** | 1.4.0 or higher |
| **Homebrew** | For installing dependencies |

> ❌ **Windows/Linux/Intel Mac are NOT supported** - voxmlx uses Apple's MLX framework which only runs on Apple Silicon.

## 📦 Installation

### Step 1: Install Plugin via BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin in Obsidian
2. Open Command Palette → `BRAT: Add a beta plugin`
3. Enter: `reallygood83/vmemo`
4. Enable VMemo in Settings → Community Plugins

### Step 2: Install Required Tools

Open **VMemo Settings** and install the required tools:

| Tool | Purpose | Install |
|------|---------|---------|
| **voxmlx** | Speech-to-text engine | Click "Install Now" or `pipx install voxmlx` |
| **ffmpeg** | Audio format converter | Click "Install Now" or `brew install ffmpeg` |

Both tools show ✅ when installed correctly.

### Prerequisites (if needed)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install pipx (for voxmlx)
brew install pipx
pipx ensurepath

# Install ffmpeg
brew install ffmpeg
```

## 🚀 Quick Start

1. **Click** the 🎤 microphone icon in the ribbon
2. **Speak** - recording indicator shows in status bar
3. **Click** again to stop (icon changes to ⏹️)
4. **Wait** for transcription (first time downloads the model ~2GB)
5. **Done!** Your transcript appears as a new note

## ⚙️ Settings

### AI Formatting (Optional)

AI formatting is **optional**. Without it, you get raw transcripts.

To enable AI formatting:
1. Toggle "Auto-format after transcription" ON
2. Choose your AI provider
3. Enter your API key

| Provider | Model | API Key |
|----------|-------|---------|
| Anthropic | Claude Sonnet 4 | [Get key](https://console.anthropic.com/) |
| OpenAI | GPT-4.1 | [Get key](https://platform.openai.com/) |
| Google | Gemini 2.5 Pro | [Get key](https://makersuite.google.com/) |
| xAI | Grok 3 | [Get key](https://x.ai/) |

### Templates

Choose output format for your transcripts:
- **Meeting Notes** - Structured with attendees, agenda, action items
- **Lecture Notes** - Academic format with key concepts
- **Interview** - Q&A format
- **Brainstorm** - Ideas and connections
- **Voice Journal** - Personal diary format
- **Raw Transcript** - Unformatted text only

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `VMemo: Start/Stop Recording` | Toggle recording |
| `VMemo: Start Recording` | Start recording |
| `VMemo: Stop Recording` | Stop recording |
| `VMemo: Upload Audio File` | Transcribe existing audio file |

## 🔄 How It Works

```
🎤 Record → 📁 Save (WebM) → 🔄 Convert (WAV) → 🎙️ Transcribe → 🤖 Format (optional) → 📝 Save Note
```

1. **Recording**: Browser captures audio as WebM (Opus codec)
2. **Conversion**: ffmpeg converts WebM → WAV (voxmlx compatibility)
3. **Transcription**: voxmlx runs Voxtral Mini 4B locally
4. **Formatting**: (Optional) AI structures the transcript
5. **Output**: Markdown note saved to your vault

## 🎙️ Transcription Engine

VMemo uses [voxmlx](https://github.com/awni/voxmlx) for local transcription:

| Feature | Details |
|---------|---------|
| **Model** | Voxtral Mini 4B (Mistral AI) |
| **Framework** | MLX (Apple Silicon optimized) |
| **Privacy** | 100% local - nothing leaves your Mac |
| **Cost** | Free (no API calls) |
| **Languages** | Multilingual support |

## 🐛 Troubleshooting

### "voxmlx not found" error
1. Open VMemo Settings
2. Click "Check Status" next to voxmlx
3. If ❌, click "Install Now"
4. Restart Obsidian

### "ffmpeg not found" error
1. Open VMemo Settings
2. Click "Check Status" next to ffmpeg
3. If ❌, click "Install Now"
4. Restart Obsidian

### Transcription fails
- Ensure both voxmlx and ffmpeg show ✅ in settings
- Check that you have ~3GB free disk space (for model download)
- First transcription takes longer (model download)

### "Format not recognised" error
- This is fixed in v1.4.4+ with automatic WebM→WAV conversion
- Update to the latest version via BRAT

## 📄 License

MIT

## 🙏 Credits

- [voxmlx](https://github.com/awni/voxmlx) - Realtime Transcription with Voxtral
- [Obsidian](https://obsidian.md) - A powerful knowledge base
- [Mistral AI](https://mistral.ai) - Voxtral Mini model
- [FFmpeg](https://ffmpeg.org) - Audio conversion
