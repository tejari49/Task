# TaskRai

![Build APK](https://github.com/DEIN-USERNAME/taskrai/workflows/Build%20Android%20APK/badge.svg)

TaskRai ist eine lokale Aufgaben-App (React + Tailwind) mit einer Capacitor-Android-Hülle. Der Login ist per Firebase Auth vorgesehen und braucht einmalige Konfiguration.

## ✨ Features

- ✅ **Google Login** (Web + Android)
- ✅ **Push Notifications** (FCM - Web + Android)
- ✅ **Task Management** (Kategorien, Prioritäten, Subtasks)
- ✅ **Gamification** (Streak-System)
- ✅ **Dark Mode**
- ✅ **Gruppen & Freunde** (Kollaboration)
- ✅ **Wiederkehrende Tasks**

## 🚀 Quick Start

### Web Development

```bash
npm install
npm run dev
```

### Android APK (Lokal)

```bash
npm install
npm install @capacitor/push-notifications
npm run android:apk
```

Die APK liegt dann in: `apk/taskrai-debug.apk`

### 🤖 GitHub Actions (Automatisch)

**APK automatisch bauen lassen!**

1. Projekt auf GitHub hochladen
2. Firebase Secrets in GitHub Repository Settings anlegen
3. Bei jedem Push → APK wird automatisch gebaut!

📖 Siehe: **[GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md)** für Details

## 📱 Firebase Login einrichten

```bash
npm install
npm run dev
```

## Firebase Login einrichten

1. Firebase-Projekt anlegen: https://console.firebase.google.com
2. **Authentication → Sign-in method**: Google aktivieren.
3. **Project settings → General**: Web-App hinzufügen und die Config-Daten notieren.
4. `.env.local` im Repo anlegen (Vorlage: `.env.example`):

```bash
cp .env.example .env.local
```

Dann die Werte eintragen:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Dev-Server neu starten:

```bash
npm run dev
```

Hinweis: Für eine gehostete Web-Version musst du die Domain unter **Authentication → Settings → Authorized domains** eintragen.

### Android Firebase (google-services.json)

Lege die bereitgestellte `google-services.json` unter `android/app/google-services.json` ab, damit Google Sign-In für die APK funktioniert.

## Online verwenden

Für die Web-Version (im Browser) brauchst du nur ein Hosting für das `dist/`-Verzeichnis:

```bash
npm run build
```

Danach das `dist/`-Verzeichnis z.B. bei Netlify/Vercel/FTP hochladen.

Wenn die Android-App ihre Inhalte **online** laden soll, trage die URL in `capacitor.config.json` ein und synchronisiere:

```json
{
  "appId": "com.irajet.task",
  "appName": "TaskRai",
  "webDir": "dist",
  "server": {
    "url": "https://example.com",
    "cleartext": false
  }
}
```

Danach:

```bash
npm run android:sync
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

Wenn du die APK direkt im Repo ablegen möchtest:

```bash
npm run android:apk
```

Die Datei wird dann nach `apk/taskrai-debug.apk` kopiert und kann committed werden.
