# TaskRai

TaskRai ist eine lokale Aufgaben-App (React + Tailwind) mit einer Capacitor-Android-Hülle. Der Login ist aktuell nur simuliert und dient als Platzhalter für eine spätere Authentifizierung.

## Entwicklung

```bash
npm install
npm run dev
```

## APK bauen (Debug)

Voraussetzungen: Android SDK + Java 17.

```bash
npm install
npm run android:build
```

Die APK liegt danach unter:

```
android/app/build/outputs/apk/debug/app-debug.apk
```
