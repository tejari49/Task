@echo off
REM 🚀 TaskRai - Automatisches GitHub Setup Script (Windows)
REM Dieses Script richtet alles für dich ein!

setlocal enabledelayedexpansion

echo ======================================
echo 🚀 TaskRai - GitHub Setup
echo ======================================
echo.

REM Prüfe ob git installiert ist
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git ist nicht installiert!
    echo Installiere Git von: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo ✅ Git gefunden
echo.

REM Prüfe ob gh CLI installiert ist
where gh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ GitHub CLI gefunden
    set HAS_GH_CLI=1
) else (
    echo ⚠️  GitHub CLI nicht gefunden (optional)
    echo Für automatische Repository-Erstellung: https://cli.github.com/
    set HAS_GH_CLI=0
)
echo.

REM Git Config prüfen
for /f "delims=" %%i in ('git config --global user.name 2^>nul') do set GIT_USER=%%i
for /f "delims=" %%i in ('git config --global user.email 2^>nul') do set GIT_EMAIL=%%i

if "!GIT_USER!"=="" (
    set /p GIT_USER="Dein Name: "
    git config --global user.name "!GIT_USER!"
)

if "!GIT_EMAIL!"=="" (
    set /p GIT_EMAIL="Deine Email: "
    git config --global user.email "!GIT_EMAIL!"
)

echo Git User: !GIT_USER!
echo Git Email: !GIT_EMAIL!
echo.

REM Repository Setup
echo ======================================
echo 📦 Repository Setup
echo ======================================
echo.

set /p REPO_NAME="Repository Name (Standard: taskrai): "
if "!REPO_NAME!"=="" set REPO_NAME=taskrai

set /p GH_USERNAME="Dein GitHub Username: "

if "!GH_USERNAME!"=="" (
    echo ❌ GitHub Username wird benötigt!
    pause
    exit /b 1
)

set REPO_URL=https://github.com/!GH_USERNAME!/!REPO_NAME!.git

echo.
echo Repository: !REPO_URL!
echo.

REM Git initialisieren
echo ======================================
echo 🔧 Git Repository initialisieren
echo ======================================
echo.

if exist .git (
    echo ⚠️  .git bereits vorhanden
    set /p REINIT="Neu initialisieren? (j/N): "
    if /i "!REINIT!"=="j" (
        rmdir /s /q .git
        git init
        echo ✅ Git neu initialisiert
    )
) else (
    git init
    echo ✅ Git initialisiert
)

REM Branch auf main setzen
git branch -M main

REM Dateien hinzufügen
echo.
echo Füge Dateien hinzu...
git add .
git commit -m "Initial commit: TaskRai mit FCM und GitHub Actions" -m "- Google Login (Web + Android)" -m "- Push Notifications (FCM)" -m "- Task Management" -m "- GitHub Actions Workflows" -m "- Vollständige Dokumentation"

echo ✅ Initial commit erstellt
echo.

REM GitHub Repository erstellen
echo ======================================
echo 🌐 GitHub Repository
echo ======================================
echo.

set PUSHED=0

if !HAS_GH_CLI! EQU 1 (
    set /p CREATE_REPO="Repository automatisch auf GitHub erstellen? (J/n): "
    if /i not "!CREATE_REPO!"=="n" (
        echo.
        echo Erstelle Repository auf GitHub...
        
        set /p IS_PRIVATE="Private Repository? (j/N): "
        
        if /i "!IS_PRIVATE!"=="j" (
            gh repo create !REPO_NAME! --private --source=. --remote=origin --push
        ) else (
            gh repo create !REPO_NAME! --public --source=. --remote=origin --push
        )
        
        echo ✅ Repository erstellt und Code gepusht!
        set PUSHED=1
    )
)

if !PUSHED! EQU 0 (
    echo Erstelle das Repository manuell auf GitHub:
    echo.
    echo 1. Gehe zu: https://github.com/new
    echo 2. Repository Name: !REPO_NAME!
    echo 3. Public oder Private wählen
    echo 4. KEIN README, .gitignore oder License hinzufügen!
    echo 5. 'Create repository' klicken
    echo.
    pause
    
    echo.
    echo Verbinde mit GitHub...
    
    REM Remote hinzufügen
    git remote remove origin 2>nul
    git remote add origin !REPO_URL!
    
    echo.
    echo Pushe Code zu GitHub...
    echo (Du musst dich ggf. mit GitHub authentifizieren)
    echo.
    
    git push -u origin main
    
    echo ✅ Code auf GitHub gepusht!
)

echo.
echo ======================================
echo 🔑 GitHub Secrets einrichten
echo ======================================
echo.

echo WICHTIG: Firebase Secrets müssen noch angelegt werden!
echo.
echo Gehe zu:
echo https://github.com/!GH_USERNAME!/!REPO_NAME!/settings/secrets/actions
echo.
echo Klicke 'New repository secret' und füge folgende Secrets hinzu:
echo.
echo 1. FIREBASE_API_KEY
echo    Wert: AIzaSyDMYgxeL7x8J0ceT4yYduhnjYn12CpnRWY
echo.
echo 2. FIREBASE_AUTH_DOMAIN
echo    Wert: task-rai.firebaseapp.com
echo.
echo 3. FIREBASE_PROJECT_ID
echo    Wert: task-rai
echo.
echo 4. FIREBASE_STORAGE_BUCKET
echo    Wert: task-rai.firebasestorage.app
echo.
echo 5. FIREBASE_MESSAGING_SENDER_ID
echo    Wert: 99376901660
echo.
echo 6. FIREBASE_APP_ID
echo    Wert: 1:99376901660:android:853c4f54be3b5e0e8d79d9
echo.
echo 7. FIREBASE_VAPID_KEY
echo    Wert: BDJDq6q9JBjqsNpqG13NiSUMvisrdPfKT3XBWGcsBGgNr5f_xp_MH6PQav75W7DI1dL1upvkA2ww9D16sksTPis
echo.

pause

echo.
echo ======================================
echo 🎉 Setup abgeschlossen!
echo ======================================
echo.

echo ✅ Repository URL:
echo    https://github.com/!GH_USERNAME!/!REPO_NAME!
echo.

echo ✅ GitHub Actions:
echo    https://github.com/!GH_USERNAME!/!REPO_NAME!/actions
echo.

echo Nächste Schritte:
echo 1. Warte ~5-10 Min bis der erste Build durch ist
echo 2. Gehe zu Actions → Workflow anschauen
echo 3. Download APK über Artifacts
echo 4. APK auf Android installieren
echo 5. Testen! 🎉
echo.

echo Bei jedem 'git push' wird jetzt automatisch eine APK gebaut!
echo.

echo ======================================
echo 🎨 Optional: Build Badge
echo ======================================
echo.
echo Füge diesen Badge zu README.md hinzu:
echo.
echo ![Build APK](https://github.com/!GH_USERNAME!/!REPO_NAME!/workflows/Build%%20Android%%20APK/badge.svg)
echo.

pause
exit /b 0
