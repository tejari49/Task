# 🚀 GitHub Actions - Automatischer APK Build

## 📋 Übersicht

Dein Projekt ist jetzt mit **GitHub Actions** ausgestattet, die automatisch APKs bauen!

### Zwei Workflows verfügbar:

1. **build-apk.yml** - Debug APK bei jedem Push
2. **build-release.yml** - Release APK mit Versionierung

---

## 🎯 Schritt 1: Projekt auf GitHub hochladen

### Option A: Via GitHub Desktop (Einfach)

1. Öffne **GitHub Desktop**
2. File → Add local repository
3. Wähle den `Task-copilot-create-final-apk` Ordner
4. Klicke "Create repository" → "Publish repository"
5. ✅ Fertig!

### Option B: Via Command Line

```bash
cd Task-copilot-create-final-apk

# Git initialisieren
git init

# Alle Dateien hinzufügen
git add .
git commit -m "Initial commit mit FCM Implementation"

# GitHub Repository erstellen (im Browser oder CLI)
# Dann verbinden:
git remote add origin https://github.com/DEIN-USERNAME/taskrai.git
git branch -M main
git push -u origin main
```

---

## 🔑 Schritt 2: GitHub Secrets einrichten

**Wichtig:** Firebase Credentials müssen als **Secrets** hinterlegt werden!

### Im GitHub Repository:

1. Gehe zu deinem Repository auf GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Klicke **"New repository secret"**

### Folgende Secrets anlegen:

| Secret Name | Wert |
|------------|------|
| `FIREBASE_API_KEY` | `DEIN_FIREBASE_API_KEY` |
| `FIREBASE_AUTH_DOMAIN` | `DEIN_FIREBASE_AUTH_DOMAIN` |
| `FIREBASE_PROJECT_ID` | `DEIN_FIREBASE_PROJECT_ID` |
| `FIREBASE_STORAGE_BUCKET` | `DEIN_FIREBASE_STORAGE_BUCKET` |
| `FIREBASE_MESSAGING_SENDER_ID` | `DEINE_FIREBASE_MESSAGING_SENDER_ID` |
| `FIREBASE_APP_ID` | `DEINE_FIREBASE_APP_ID` |
| `FIREBASE_VAPID_KEY` | `DEIN_FIREBASE_VAPID_KEY` |

**So sieht es aus:**
```
Name: FIREBASE_API_KEY
Secret: DEIN_FIREBASE_API_KEY
```

Dann **"Add secret"** klicken und für alle 7 Secrets wiederholen.

---

## 🏗️ Schritt 3: Workflows nutzen

### Workflow 1: Debug APK (automatisch)

**Trigger:** Bei jedem Push auf `main` oder `master` Branch

```bash
# Änderung machen
git add .
git commit -m "Update"
git push

# ✅ GitHub Actions startet automatisch!
```

**Workflow verfolgen:**
1. GitHub Repository → **Actions** Tab
2. Siehst den laufenden Build
3. Nach ~5-10 Minuten ist die APK fertig

**APK herunterladen:**
1. Actions → Workflow auswählen
2. Scrolle runter zu **"Artifacts"**
3. Download `taskrai-debug-apk`
4. ✅ APK liegt in der ZIP-Datei!

### Workflow 2: Release APK (manuell oder via Tag)

#### Option A: Manuell über GitHub UI

1. GitHub Repository → **Actions** Tab
2. Links: **"Build Release APK"** auswählen
3. Rechts: **"Run workflow"** Button
4. Version eingeben (z.B. `1.0.0`)
5. **"Run workflow"** klicken
6. ✅ Build startet!

#### Option B: Via Git Tag

```bash
# Release Version taggen
git tag v1.0.0
git push origin v1.0.0

# ✅ Release Build startet automatisch!
# ✅ GitHub Release wird erstellt!
```

**Release APK herunterladen:**
1. GitHub Repository → **Releases** (rechte Sidebar)
2. Neueste Release öffnen
3. **Assets** → `taskrai-v1.0.0.apk` herunterladen
4. ✅ APK direkt installierbar!

---

## 📊 Workflow Status Badge

Füge diesen Badge zu deiner README.md hinzu:

```markdown
![Build APK](https://github.com/DEIN-USERNAME/taskrai/workflows/Build%20Android%20APK/badge.svg)
```

Ersetzt **DEIN-USERNAME** mit deinem GitHub Username.

---

## 🔍 Workflow Details

### Was passiert beim Build?

```
1. ✅ Code auschecken
2. ✅ Node.js 20 installieren
3. ✅ Java 17 installieren
4. ✅ Android SDK installieren
5. ✅ npm Dependencies installieren
6. ✅ @capacitor/push-notifications installieren
7. ✅ .env.local aus Secrets erstellen
8. ✅ Web Assets bauen (Vite)
9. ✅ Capacitor sync
10. ✅ Gradle APK Build
11. ✅ APK hochladen als Artifact
```

**Dauer:** ~5-10 Minuten pro Build

---

## 🛠️ Troubleshooting

### Problem: "Secrets not found"

**Lösung:** 
- Alle 7 Firebase Secrets in GitHub Repository Settings angelegt?
- Namen exakt richtig geschrieben?
- Secrets ohne Anführungszeichen eingegeben?

### Problem: Build schlägt fehl bei Gradle

**Lösung:**
```bash
# Lokal testen ob gradlew funktioniert
cd android
chmod +x gradlew
./gradlew assembleDebug
```

Wenn lokal OK → GitHub Actions sollte auch funktionieren

### Problem: APK Artifact nicht gefunden

**Lösung:**
- Workflow vollständig durchgelaufen?
- Grünes Häkchen bei allen Steps?
- Artifacts Tab am Ende der Workflow-Seite prüfen

---

## 🎨 Workflow anpassen

### Build nur bei bestimmten Dateien triggern:

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'android/**'
      - 'package.json'
```

### Benachrichtigungen bei fertigem Build:

```yaml
- name: Notify on Success
  if: success()
  run: |
    echo "✅ APK Build erfolgreich!"
    # Hier Discord/Slack Webhook einfügen
```

### Automatisch auf Google Play hochladen:

```yaml
- name: Upload to Play Store
  uses: r0adkll/upload-google-play@v1
  with:
    serviceAccountJsonPlainText: ${{ secrets.SERVICE_ACCOUNT_JSON }}
    packageName: com.irajet.task
    releaseFiles: apk/taskrai-v*.apk
    track: internal
```

---

## 📱 APK Installation auf Android

### Vom Computer:

```bash
# APK per USB installieren
adb install taskrai-debug.apk

# Oder per Browser download
# → Auf Handy übertragen
# → Datei-Manager öffnen
# → APK antippen → Installieren
```

### Sicherheitshinweis:

Bei erster Installation:
1. Android fragt: "Aus unbekannter Quelle installieren?"
2. **"Einstellungen"** öffnen
3. **"Dieser Quelle vertrauen"** aktivieren
4. Zurück → **"Installieren"**

---

## 🔐 APK Signieren (Production)

Für Google Play Store brauchst du eine signierte APK:

### 1. Keystore erstellen:

```bash
keytool -genkey -v -keystore taskrai.keystore -alias taskrai -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Keystore als Base64 in GitHub Secrets:

```bash
base64 taskrai.keystore > keystore.txt
# Inhalt von keystore.txt als Secret KEYSTORE_FILE speichern
```

### 3. Weitere Secrets:

- `KEYSTORE_PASSWORD` - Keystore Passwort
- `KEY_ALIAS` - Key Alias (z.B. "taskrai")
- `KEY_PASSWORD` - Key Passwort

### 4. Workflow erweitern:

Der Release-Workflow enthält bereits einen Platzhalter für Signing!

---

## 📈 Nächste Schritte

### Automatische Versionierung:

```bash
# package.json
{
  "version": "1.0.0",
  "scripts": {
    "version:patch": "npm version patch && git push && git push --tags",
    "version:minor": "npm version minor && git push && git push --tags",
    "version:major": "npm version major && git push && git push --tags"
  }
}

# Benutzen:
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.1 → 1.1.0
npm run version:major  # 1.1.0 → 2.0.0
```

### CI/CD für Web-Deployment:

```yaml
# .github/workflows/deploy-web.yml
- name: Deploy to Firebase Hosting
  uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    repoToken: '${{ secrets.GITHUB_TOKEN }}'
    firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
    projectId: DEIN_FIREBASE_PROJECT_ID
```

---

## ✅ Checkliste

- [ ] Projekt auf GitHub hochgeladen
- [ ] Alle 7 Firebase Secrets angelegt
- [ ] Erster Push gemacht
- [ ] Build Workflow läuft durch
- [ ] APK Artifact heruntergeladen
- [ ] APK auf Android installiert & getestet
- [ ] Release erstellt (v1.0.0)
- [ ] Release APK heruntergeladen
- [ ] Alles funktioniert! 🎉

---

## 🎯 Quick Reference

```bash
# Debug APK bauen (automatisch bei Push)
git push

# Release APK bauen (via Tag)
git tag v1.0.0
git push origin v1.0.0

# APK herunterladen
# → GitHub → Actions → Workflow → Artifacts

# APK installieren
adb install taskrai-debug.apk
```

---

## 📞 Support

**GitHub Actions Logs:**
- Actions Tab → Failed Workflow → Step Details anschauen

**Häufige Fehler:**
- `Secrets not found` → Secrets richtig angelegt?
- `gradlew: Permission denied` → Wird automatisch gefixt via `chmod +x`
- `Build failed` → Logs im betroffenen Step prüfen

---

## 🎉 Fertig!

Dein Projekt baut jetzt **automatisch APKs** bei jedem Push! 🚀

**Vorteile:**
- ✅ Keine lokale Android SDK Installation nötig
- ✅ Konsistente Builds auf GitHub Servern
- ✅ APKs immer verfügbar als Artifacts
- ✅ Automatische Releases mit Versionierung
- ✅ Team kann APKs direkt herunterladen

**Nächster Build:** Einfach Code ändern und pushen! 💪
