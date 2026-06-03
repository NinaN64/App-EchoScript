# EchoScript 🎙️

An AI-powered meeting assistant that transcribes your meetings in real time and reads whiteboards with OCR.

---

## What's inside

- **Live transcription** — uses the device's built-in speech engine, keeps listening even through silences
- **Whiteboard OCR** — take a photo of a whiteboard and it extracts the text automatically (Tesseract.js)
- **Meeting history** — everything saved locally on device via AsyncStorage


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
