# 🎙️ VMemo - Obsidian Voice Memo Plugin

Voice recording, transcription, and AI-powered document formatting for Obsidian.

## Features

- 🎤 **One-click Recording** - Start/stop with ribbon icon or hotkey
- 🔄 **Background Recording** - Keep working while recording
- ⏱️ **Live Timer** - See recording duration in status bar
- 🎙️ **Local Transcription** - Uses voxmlx (free, private, offline)
- 🤖 **AI Formatting** - 4 providers (Claude, GPT-4, Gemini, Grok)
- 📝 **Templates** - Meeting notes, lecture notes, journal, and more

## Requirements

- macOS with Apple Silicon (M1/M2/M3/M4)
- Python 3.11+
- Obsidian 1.4.0+

## Installation (BRAT)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open Command Palette → `BRAT: Add a beta plugin`
3. Enter: `reallygood83/vmemo`
4. Enable VMemo in Settings → Community Plugins

## Quick Start

1. Click the 🎤 microphone icon in the ribbon to start recording
2. Click again (now ⏹️) to stop
3. Wait for transcription and AI formatting
4. Your formatted note appears in the vault!

## Settings

### AI Providers
Configure your preferred AI provider and API key:
- **Anthropic** (Claude Sonnet 4)
- **OpenAI** (GPT-4.1)
- **Google** (Gemini 2.5 Pro)
- **xAI** (Grok 3)

### Templates
Choose from built-in templates:
- Meeting Notes
- Lecture Notes
- Interview
- Brainstorm
- Voice Journal
- Raw Transcript

## Commands

| Command | Description |
|---------|-------------|
| `VMemo: Start/Stop Recording` | Toggle recording |
| `VMemo: Start Recording` | Start recording |
| `VMemo: Stop Recording` | Stop recording |
| `VMemo: Upload Audio File` | Transcribe existing audio |

## How It Works

```
🎤 Record → 📁 Save Audio → 🎙️ Transcribe (voxmlx) → 🤖 Format (AI) → 📝 Save Note
```

1. **Recording**: Web Audio API captures microphone input
2. **Transcription**: voxmlx (Voxtral Mini 4B) runs locally
3. **Formatting**: AI structures the transcript using your template
4. **Output**: Markdown note saved to your vault

## Transcription Engine

VMemo uses [voxmlx](https://github.com/awni/voxmlx) for local transcription:
- **Model**: Voxtral Mini 4B (Mistral AI)
- **Framework**: MLX (Apple Silicon optimized)
- **Privacy**: All processing happens on your Mac
- **Cost**: Free (no API calls)

On first use, VMemo will automatically install voxmlx if not present.

## License

MIT

## Credits

- [voxmlx](https://github.com/awni/voxmlx) - Realtime Transcription with Voxtral
- [Obsidian](https://obsidian.md) - A powerful knowledge base
- Mistral AI - Voxtral Mini model
