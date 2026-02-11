# TaskRai

TaskRai ist eine lokale Aufgaben-App (React + Tailwind) mit einer Capacitor-Android-Hülle. Der Login ist aktuell nur simuliert und dient als Platzhalter für eine spätere Authentifizierung.

## Entwicklung

```bash
npm install
npm run dev
```

## Online verwenden

Für die Web-Version (im Browser) brauchst du nur ein Hosting für das `dist/`-Verzeichnis:

```bash
npm run build
```

Danach das `dist/`-Verzeichnis z.B. bei Netlify/Vercel/FTP hochladen.

Wenn die Android-App ihre Inhalte **online** laden soll, trage die URL in `capacitor.config.json` ein und synchronisiere:

```json
{
  "appId": "com.taskrai.app",
  "appName": "TaskRai",
  "webDir": "dist",
  "server": {
    "url": "https://DEINE-DOMAIN.de",
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
