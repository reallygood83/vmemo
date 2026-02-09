# 🎙️ VMemo - 옵시디언 음성 메모 플러그인

> **macOS Apple Silicon (M1/M2/M3/M4) 전용**

음성 녹음과 로컬 AI 트랜스크립션을 위한 옵시디언 플러그인입니다. 음성을 녹음하면 즉시 텍스트로 변환됩니다 - 모든 처리가 Mac에서 로컬로 이루어집니다.

[English README](./README.md)

## ✨ 주요 기능

- 🎤 **원클릭 녹음** - 리본 아이콘 또는 단축키로 시작/정지
- 🔄 **백그라운드 녹음** - 녹음 중에도 다른 작업 가능
- ⏱️ **실시간 타이머** - 상태바에서 녹음 시간 확인
- 🎙️ **100% 로컬 트랜스크립션** - 무료, 프라이버시 보장, 인터넷 불필요
- 🤖 **AI 포맷팅 (선택사항)** - Claude, GPT-4, Gemini, Grok으로 정리
- 📝 **템플릿** - 회의록, 강의노트, 일기 등 다양한 형식

## ⚠️ 시스템 요구사항

| 요구사항 | 상세 |
|----------|------|
| **macOS** | Apple Silicon (M1/M2/M3/M4) **필수** |
| **Python** | 3.10 이상 |
| **Obsidian** | 1.4.0 이상 |
| **Homebrew** | 의존성 설치용 |

> ❌ **Windows/Linux/Intel Mac은 지원되지 않습니다** - voxmlx는 Apple Silicon에서만 동작하는 MLX 프레임워크를 사용합니다.

## 📦 설치 방법

### 1단계: BRAT으로 플러그인 설치

1. 옵시디언에 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 플러그인 설치
2. 명령 팔레트 → `BRAT: Add a beta plugin`
3. 입력: `reallygood83/vmemo`
4. 설정 → 커뮤니티 플러그인에서 VMemo 활성화

### 2단계: 필수 도구 설치

**VMemo 설정**을 열고 필수 도구를 설치하세요:

| 도구 | 용도 | 설치 방법 |
|------|------|----------|
| **voxmlx** | 음성→텍스트 변환 엔진 | "Install Now" 클릭 또는 `pipx install voxmlx` |
| **ffmpeg** | 오디오 포맷 변환 | "Install Now" 클릭 또는 `brew install ffmpeg` |

설치가 완료되면 ✅ 표시가 나타납니다.

### 사전 설치 (필요시)

```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# pipx 설치 (voxmlx용)
brew install pipx
pipx ensurepath

# ffmpeg 설치
brew install ffmpeg
```

## 🚀 빠른 시작

1. 리본의 🎤 마이크 아이콘을 **클릭**
2. **말하기** - 상태바에 녹음 표시
3. 다시 **클릭**하여 정지 (아이콘이 ⏹️로 변경됨)
4. 트랜스크립션 **대기** (처음에는 모델 다운로드 ~2GB)
5. **완료!** 새 노트로 트랜스크립트가 저장됨

## ⚙️ 설정

### AI 포맷팅 (선택사항)

AI 포맷팅은 **선택사항**입니다. 없어도 원본 트랜스크립트를 받을 수 있습니다.

AI 포맷팅 활성화:
1. "Auto-format after transcription" 켜기
2. AI 제공자 선택
3. API 키 입력

| 제공자 | 모델 | API 키 |
|--------|------|--------|
| Anthropic | Claude Sonnet 4 | [발급받기](https://console.anthropic.com/) |
| OpenAI | GPT-4.1 | [발급받기](https://platform.openai.com/) |
| Google | Gemini 2.5 Pro | [발급받기](https://makersuite.google.com/) |
| xAI | Grok 3 | [발급받기](https://x.ai/) |

### 템플릿

트랜스크립트 출력 형식 선택:
- **Meeting Notes** - 참석자, 안건, 액션 아이템 포함
- **Lecture Notes** - 핵심 개념 정리 형식
- **Interview** - Q&A 형식
- **Brainstorm** - 아이디어 연결
- **Voice Journal** - 개인 일기 형식
- **Raw Transcript** - 포맷팅 없는 원본 텍스트

## 🔧 명령어

| 명령어 | 설명 |
|--------|------|
| `VMemo: Start/Stop Recording` | 녹음 토글 |
| `VMemo: Start Recording` | 녹음 시작 |
| `VMemo: Stop Recording` | 녹음 정지 |
| `VMemo: Upload Audio File` | 기존 오디오 파일 트랜스크립션 |

## 🔄 작동 원리

```
🎤 녹음 → 📁 저장 (WebM) → 🔄 변환 (WAV) → 🎙️ 트랜스크립션 → 🤖 포맷팅 (선택) → 📝 노트 저장
```

1. **녹음**: 브라우저가 WebM (Opus 코덱) 형식으로 오디오 캡처
2. **변환**: ffmpeg이 WebM → WAV 변환 (voxmlx 호환성)
3. **트랜스크립션**: voxmlx가 Voxtral Mini 4B를 로컬에서 실행
4. **포맷팅**: (선택사항) AI가 트랜스크립트를 정리
5. **출력**: 마크다운 노트로 볼트에 저장

## 🎙️ 트랜스크립션 엔진

VMemo는 로컬 트랜스크립션을 위해 [voxmlx](https://github.com/awni/voxmlx)를 사용합니다:

| 특징 | 상세 |
|------|------|
| **모델** | Voxtral Mini 4B (Mistral AI) |
| **프레임워크** | MLX (Apple Silicon 최적화) |
| **프라이버시** | 100% 로컬 - Mac 밖으로 데이터가 나가지 않음 |
| **비용** | 무료 (API 호출 없음) |
| **언어** | 다국어 지원 (한국어 포함) |

## 🐛 문제 해결

### "voxmlx not found" 에러
1. VMemo 설정 열기
2. voxmlx 옆의 "Check Status" 클릭
3. ❌이면 "Install Now" 클릭
4. 옵시디언 재시작

### "ffmpeg not found" 에러
1. VMemo 설정 열기
2. ffmpeg 옆의 "Check Status" 클릭
3. ❌이면 "Install Now" 클릭
4. 옵시디언 재시작

### 트랜스크립션 실패
- 설정에서 voxmlx와 ffmpeg 모두 ✅인지 확인
- 디스크 여유 공간 ~3GB 확인 (모델 다운로드용)
- 첫 트랜스크립션은 모델 다운로드로 시간이 더 걸림

### "Format not recognised" 에러
- v1.4.4 이상에서 자동 WebM→WAV 변환으로 수정됨
- BRAT에서 최신 버전으로 업데이트

## 📄 라이선스

MIT

## 🙏 크레딧

- [voxmlx](https://github.com/awni/voxmlx) - Voxtral을 이용한 실시간 트랜스크립션
- [Obsidian](https://obsidian.md) - 강력한 지식 베이스
- [Mistral AI](https://mistral.ai) - Voxtral Mini 모델
- [FFmpeg](https://ffmpeg.org) - 오디오 변환
