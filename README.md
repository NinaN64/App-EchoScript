# EchoScript 🎙️

An AI-powered meeting assistant that transcribes your meetings in real time, reads whiteboards with OCR, and generates summaries using Google Gemini.

---

## What's inside

- **Live transcription** — uses the device's built-in speech engine, keeps listening even through silences
- **Whiteboard OCR** — take a photo of a whiteboard and it extracts the text automatically (Tesseract.js)
- **AI summary** — sends transcript + notes to Gemini 1.5 Flash and gets back a clean summary
- **Meeting history** — everything saved locally on device via AsyncStorage

To use AI summaries, create a `.env` file with:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```
Get a free key at [aistudio.google.com](https://aistudio.google.com).

---

## Running the app

**Install dependencies first:**
```bash
npm install
```

### Web (quickest)
```bash
npm run web
```
Open `http://localhost:8081`. Good for testing UI — live transcription won't work here.

### Expo Go (real device)
```bash
npx expo start
```
Scan the QR code with your phone. Best for quick testing without building anything.

### iOS Simulator (macOS + Xcode required)
```bash
npx expo start --ios
```
Or press `i` in the terminal after starting.

### Android Emulator (Android Studio + AVD required)
```bash
npx expo start --android
```
Or press `a` in the terminal after starting.

---
