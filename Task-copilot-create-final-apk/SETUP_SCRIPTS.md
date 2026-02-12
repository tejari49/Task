# 🚀 Automatisches GitHub Setup

## 🎯 Super einfach: Alles mit 1 Befehl!

Ich kann die Daten nicht direkt pushen, aber diese Scripts machen es **automatisch für dich**!

---

## 🖥️ Mac / Linux

```bash
cd Task-copilot-create-final-apk
chmod +x setup-github.sh
./setup-github.sh
```

Das Script macht:
1. ✅ Git initialisieren
2. ✅ Commit erstellen
3. ✅ GitHub Repository erstellen (mit gh CLI)
4. ✅ Code pushen
5. ✅ Zeigt dir wie Secrets angelegt werden

**Fertig in 2 Minuten!** ⚡

---

## 🪟 Windows

```cmd
cd Task-copilot-create-final-apk
setup-github.bat
```

Das Script macht:
1. ✅ Git initialisieren
2. ✅ Commit erstellen
3. ✅ GitHub Repository erstellen (mit gh CLI)
4. ✅ Code pushen
5. ✅ Zeigt dir wie Secrets angelegt werden

**Fertig in 2 Minuten!** ⚡

---

## 📋 Was das Script braucht:

### Erforderlich:
- ✅ **Git** installiert
  - Download: https://git-scm.com/downloads
  - Prüfen: `git --version`

### Optional (macht es noch einfacher):
- ✅ **GitHub CLI** installiert
  - Download: https://cli.github.com/
  - Prüfen: `gh --version`
  - Login: `gh auth login`

**Mit GitHub CLI:** Script erstellt Repository automatisch  
**Ohne GitHub CLI:** Du erstellst Repository manuell (wird dir gesagt wie)

---

## 🎬 Ablauf (interaktiv)

Das Script fragt dich:

```
1. Dein GitHub Username? 
   → Eingeben

2. Repository Name? (Standard: taskrai)
   → Enter drücken oder eigenen Namen

3. Public oder Private?
   → Wählen

4. Repository erstellen?
   → Mit gh CLI: Automatisch
   → Ohne gh CLI: Script sagt dir wie

5. Secrets angelegt?
   → Script zeigt alle Werte
   → Du kopierst sie in GitHub
```

**Das war's!** 🎉

---

## 🔑 GitHub Secrets

Das Script zeigt dir **genau** welche Secrets du anlegen musst:

```
Gehe zu: https://github.com/USERNAME/taskrai/settings/secrets/actions

Klicke "New repository secret" und füge hinzu:

1. FIREBASE_API_KEY → DEIN_FIREBASE_API_KEY
2. FIREBASE_AUTH_DOMAIN → DEIN_FIREBASE_AUTH_DOMAIN
3. FIREBASE_PROJECT_ID → DEIN_FIREBASE_PROJECT_ID
4. FIREBASE_STORAGE_BUCKET → DEIN_FIREBASE_STORAGE_BUCKET
5. FIREBASE_MESSAGING_SENDER_ID → DEINE_FIREBASE_MESSAGING_SENDER_ID
6. FIREBASE_APP_ID → DEINE_FIREBASE_APP_ID
7. FIREBASE_VAPID_KEY → DEIN_FIREBASE_VAPID_KEY
```

Alle Werte werden dir **im Script angezeigt** - einfach copy & paste!

---

## ✅ Nach dem Script:

### Automatisch erledigt:
- ✅ Git Repository initialisiert
- ✅ Alle Dateien committed
- ✅ Auf GitHub gepusht
- ✅ Workflows aktiviert

### Du musst noch:
1. **Secrets anlegen** (Script zeigt wie)
2. **Warten** (~5-10 Min)
3. **APK downloaden** (Actions → Artifacts)

---

## 🎯 Ohne Script (manuell)

Falls du die Scripts nicht nutzen willst:

```bash
# 1. Git initialisieren
git init
git add .
git commit -m "Initial commit"

# 2. Repository auf GitHub erstellen
# → github.com/new

# 3. Remote hinzufügen & pushen
git remote add origin https://github.com/USERNAME/taskrai.git
git push -u origin main

# 4. Secrets anlegen
# → Repository Settings → Secrets → Actions
# → 7 Secrets hinzufügen (siehe GITHUB_ACTIONS_GUIDE.md)
```

**Aber mit Script ist es viel einfacher!** 😊

---

## 🐛 Troubleshooting

### "git not found"
→ Git installieren: https://git-scm.com/downloads

### "gh not found" 
→ Optional, aber hilfreich: https://cli.github.com/
→ Oder: Repository manuell erstellen (Script sagt wie)

### "Authentication required"
→ Bei `git push` wirst du nach GitHub Credentials gefragt
→ Oder: `gh auth login` für einfachere Authentifizierung

### "Permission denied"
→ Mac/Linux: `chmod +x setup-github.sh` vergessen?

---

## 📊 Vergleich

| Methode | Zeit | Schwierigkeit |
|---------|------|---------------|
| **setup-github.sh** (Mac/Linux) | 2 Min | ⭐ Sehr einfach |
| **setup-github.bat** (Windows) | 2 Min | ⭐ Sehr einfach |
| **Manuell** (siehe Anleitung) | 5 Min | ⭐⭐ Einfach |
| **Ich pushe für dich** | ❌ Nicht möglich | - |

---

## 🎉 Empfehlung

**Nutze die Scripts!**

Sie machen alles automatisch und zeigen dir **genau** was zu tun ist.

### Mac / Linux:
```bash
./setup-github.sh
```

### Windows:
```cmd
setup-github.bat
```

**Fertig in 2 Minuten!** ⚡

---

## 🎯 Nach dem Setup

```bash
# Änderungen machen
git add .
git commit -m "Meine Änderung"
git push

# ✅ APK wird automatisch gebaut!
# ✅ Download: GitHub → Actions → Artifacts
```

**Bei jedem Push = Neue APK!** 🚀

---

## 💡 GitHub CLI Empfehlung

**GitHub CLI macht es noch einfacher:**

```bash
# Installation
# Mac: brew install gh
# Windows: winget install gh
# Linux: siehe https://cli.github.com/

# Login
gh auth login

# Repository erstellen & pushen (in einem Befehl!)
gh repo create taskrai --public --source=. --remote=origin --push

# ✅ Fertig!
```

**Dann macht das Setup-Script alles automatisch!**

---

## 📞 Support

**Scripts funktionieren nicht?**
→ Siehe [GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md) für manuelle Anleitung

**GitHub Secrets unklar?**
→ Script zeigt dir **alle Werte** - einfach kopieren!

**Weitere Fragen?**
→ Alle Details in [GITHUB_ACTIONS_GUIDE.md](GITHUB_ACTIONS_GUIDE.md)

---

**Viel Erfolg!** 🚀

Die Scripts machen es **super einfach** - einfach ausführen und fertig!
