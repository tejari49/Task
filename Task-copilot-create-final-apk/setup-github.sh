#!/bin/bash

# 🚀 TaskRai - Automatisches GitHub Setup Script
# Dieses Script richtet alles für dich ein!

set -e  # Bei Fehler abbrechen

echo "======================================"
echo "🚀 TaskRai - GitHub Setup"
echo "======================================"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Prüfe ob git installiert ist
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git ist nicht installiert!${NC}"
    echo "Installiere Git von: https://git-scm.com/downloads"
    exit 1
fi

echo -e "${GREEN}✅ Git gefunden${NC}"
echo ""

# Prüfe ob gh CLI installiert ist (optional, aber hilfreich)
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI gefunden${NC}"
    HAS_GH_CLI=true
else
    echo -e "${YELLOW}⚠️  GitHub CLI nicht gefunden (optional)${NC}"
    echo "Für automatische Repository-Erstellung installiere: https://cli.github.com/"
    HAS_GH_CLI=false
fi
echo ""

# Git Config prüfen
GIT_USER=$(git config --global user.name || echo "")
GIT_EMAIL=$(git config --global user.email || echo "")

if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  Git nicht konfiguriert${NC}"
    echo ""
    read -p "Dein Name: " GIT_USER
    read -p "Deine Email: " GIT_EMAIL
    
    git config --global user.name "$GIT_USER"
    git config --global user.email "$GIT_EMAIL"
    echo -e "${GREEN}✅ Git konfiguriert${NC}"
fi

echo -e "${BLUE}Git User: $GIT_USER${NC}"
echo -e "${BLUE}Git Email: $GIT_EMAIL${NC}"
echo ""

# Repository Name
echo "======================================"
echo "📦 Repository Setup"
echo "======================================"
echo ""
read -p "Repository Name (Standard: taskrai): " REPO_NAME
REPO_NAME=${REPO_NAME:-taskrai}

read -p "Dein GitHub Username: " GH_USERNAME

if [ -z "$GH_USERNAME" ]; then
    echo -e "${RED}❌ GitHub Username wird benötigt!${NC}"
    exit 1
fi

REPO_URL="https://github.com/$GH_USERNAME/$REPO_NAME.git"

echo ""
echo -e "${BLUE}Repository: $REPO_URL${NC}"
echo ""

# Git initialisieren
echo "======================================"
echo "🔧 Git Repository initialisieren"
echo "======================================"
echo ""

if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  .git bereits vorhanden${NC}"
    read -p "Neu initialisieren? (j/N): " REINIT
    if [ "$REINIT" = "j" ] || [ "$REINIT" = "J" ]; then
        rm -rf .git
        git init
        echo -e "${GREEN}✅ Git neu initialisiert${NC}"
    fi
else
    git init
    echo -e "${GREEN}✅ Git initialisiert${NC}"
fi

# Branch umbenennen auf main
git branch -M main

# Alle Dateien hinzufügen
echo ""
echo "Füge Dateien hinzu..."
git add .
git commit -m "Initial commit: TaskRai mit FCM und GitHub Actions

- Google Login (Web + Android)
- Push Notifications (FCM)
- Task Management
- GitHub Actions Workflows
- Vollständige Dokumentation"

echo -e "${GREEN}✅ Initial commit erstellt${NC}"
echo ""

# Repository auf GitHub erstellen
echo "======================================"
echo "🌐 GitHub Repository"
echo "======================================"
echo ""

if [ "$HAS_GH_CLI" = true ]; then
    read -p "Repository automatisch auf GitHub erstellen? (J/n): " CREATE_REPO
    if [ "$CREATE_REPO" != "n" ] && [ "$CREATE_REPO" != "N" ]; then
        echo ""
        echo "Erstelle Repository auf GitHub..."
        
        # Prüfe ob private oder public
        read -p "Private Repository? (j/N): " IS_PRIVATE
        
        if [ "$IS_PRIVATE" = "j" ] || [ "$IS_PRIVATE" = "J" ]; then
            gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
        else
            gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
        fi
        
        echo -e "${GREEN}✅ Repository erstellt und Code gepusht!${NC}"
        PUSHED=true
    else
        PUSHED=false
    fi
else
    echo -e "${YELLOW}Erstelle das Repository manuell auf GitHub:${NC}"
    echo ""
    echo "1. Gehe zu: https://github.com/new"
    echo "2. Repository Name: $REPO_NAME"
    echo "3. Public oder Private wählen"
    echo "4. KEIN README, .gitignore oder License hinzufügen!"
    echo "5. 'Create repository' klicken"
    echo ""
    read -p "Repository erstellt? Drücke Enter wenn fertig..."
    
    PUSHED=false
fi

# Remote hinzufügen und pushen (falls nicht schon geschehen)
if [ "$PUSHED" = false ]; then
    echo ""
    echo "Verbinde mit GitHub..."
    
    # Prüfe ob remote bereits existiert
    if git remote | grep -q "origin"; then
        git remote remove origin
    fi
    
    git remote add origin "$REPO_URL"
    
    echo ""
    echo "Pushe Code zu GitHub..."
    echo -e "${YELLOW}(Du musst dich ggf. mit GitHub authentifizieren)${NC}"
    echo ""
    
    git push -u origin main
    
    echo -e "${GREEN}✅ Code auf GitHub gepusht!${NC}"
fi

echo ""
echo "======================================"
echo "🔑 GitHub Secrets einrichten"
echo "======================================"
echo ""

echo -e "${YELLOW}WICHTIG: Firebase Secrets müssen noch angelegt werden!${NC}"
echo ""
echo "Gehe zu:"
echo -e "${BLUE}https://github.com/$GH_USERNAME/$REPO_NAME/settings/secrets/actions${NC}"
echo ""
echo "Klicke 'New repository secret' und füge folgende Secrets hinzu:"
echo ""
echo "1. FIREBASE_API_KEY"
echo "   Wert: DEIN_FIREBASE_API_KEY"
echo ""
echo "2. FIREBASE_AUTH_DOMAIN"
echo "   Wert: DEIN_FIREBASE_AUTH_DOMAIN"
echo ""
echo "3. FIREBASE_PROJECT_ID"
echo "   Wert: DEIN_FIREBASE_PROJECT_ID"
echo ""
echo "4. FIREBASE_STORAGE_BUCKET"
echo "   Wert: DEIN_FIREBASE_STORAGE_BUCKET"
echo ""
echo "5. FIREBASE_MESSAGING_SENDER_ID"
echo "   Wert: DEINE_FIREBASE_MESSAGING_SENDER_ID"
echo ""
echo "6. FIREBASE_APP_ID"
echo "   Wert: DEINE_FIREBASE_APP_ID"
echo ""
echo "7. FIREBASE_VAPID_KEY"
echo "   Wert: DEIN_FIREBASE_VAPID_KEY"
echo ""

read -p "Secrets angelegt? Drücke Enter wenn fertig..."

echo ""
echo "======================================"
echo "🎉 Setup abgeschlossen!"
echo "======================================"
echo ""

echo -e "${GREEN}✅ Repository URL:${NC}"
echo -e "${BLUE}   https://github.com/$GH_USERNAME/$REPO_NAME${NC}"
echo ""

echo -e "${GREEN}✅ GitHub Actions:${NC}"
echo -e "${BLUE}   https://github.com/$GH_USERNAME/$REPO_NAME/actions${NC}"
echo ""

echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Warte ~5-10 Min bis der erste Build durch ist"
echo "2. Gehe zu Actions → Workflow anschauen"
echo "3. Download APK über Artifacts"
echo "4. APK auf Android installieren"
echo "5. Testen! 🎉"
echo ""

echo -e "${GREEN}Bei jedem 'git push' wird jetzt automatisch eine APK gebaut!${NC}"
echo ""

# Badge für README.md
echo "======================================"
echo "🎨 Optional: Build Badge"
echo "======================================"
echo ""
echo "Füge diesen Badge zu README.md hinzu:"
echo ""
echo "![Build APK](https://github.com/$GH_USERNAME/$REPO_NAME/workflows/Build%20Android%20APK/badge.svg)"
echo ""

exit 0
