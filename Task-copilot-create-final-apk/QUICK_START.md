# 🚀 TaskRai FCM - Quick Start Guide

## ✅ Grundstruktur ist bereits vorbereitet!

### Was bereits fertig ist:
- ✅ `.env.example` als Vorlage vorhanden
- ✅ `firebase-messaging-sw.js` vorbereitet (bitte eigene Credentials eintragen)
- ✅ Code vollständig implementiert
- ✅ Android Permissions gesetzt

---

## ⚙️ Schritt 0: Firebase Credentials eintragen

1. Kopiere `.env.example` zu `.env.local` und trage deine Firebase-Werte ein.
2. Öffne `public/firebase-messaging-sw.js` und ersetze die Platzhalter (`VITE_FIREBASE_*`) durch dieselben Werte.
   - Hinweis: Ohne Ersetzung wird Firebase im Service Worker nicht initialisiert. Optional kannst du das über einen Build-Schritt automatisieren.

---

## 📦 Schritt 1: Pakete installieren

```bash
cd Task-copilot-create-final-apk

# Capacitor Push Plugin installieren
npm install @capacitor/push-notifications

# Mit Android synchronisieren
npx cap sync android
```

---

## 🌐 Schritt 2: Web testen

```bash
npm run dev
```

1. Browser öffnet sich auf http://localhost:5173
2. **Mit Google anmelden**
3. Gehe zu **Einstellungen** (⚙️ Icon oben rechts)
4. Klicke auf **"Benachrichtigungen aktivieren"**
5. Browser fragt nach Permission → **"Zulassen"** klicken
6. ✅ **Push Token** sollte nun sichtbar sein!

**Screenshot der Settings:**
```
┌─────────────────────────────────┐
│  🔔 Push Benachrichtigungen     │
│  Status: [Aktiv]                │
│  [Token: DEIN_TOKEN...]         │
└─────────────────────────────────┘
```

---

## 📱 Schritt 3: Android APK bauen & testen

```bash
# Debug APK bauen
npm run android:apk
```

Die APK liegt dann hier:
```
apk/taskrai-debug.apk
```

**Auf Android-Gerät installieren:**
1. APK auf Handy übertragen
2. Installieren (Developer Mode aktivieren falls nötig)
3. App öffnen
4. Mit Google anmelden
5. Zu Einstellungen gehen
6. **"Benachrichtigungen aktivieren"** klicken
7. Android fragt nach Permission → **"Zulassen"**
8. ✅ Token wird angezeigt

---

## 🔔 Schritt 4: Test-Benachrichtigung senden

### Via Firebase Console (Empfohlen)

1. Gehe zu: https://console.firebase.google.com
2. Projekt: **dein Firebase-Projekt** auswählen
3. Links: **Messaging** (oder "Engage" → "Messaging")
4. Button: **"Create your first campaign"** oder **"New campaign"**
5. Wähle: **"Firebase Notification messages"**

**Notification Details:**
```
Notification title: Test von TaskRai
Notification text: Push funktioniert! 🎉
```

6. Klicke **"Next"**
7. **Target:** Wähle "User segment" → "All users" ODER "Single device"
8. Wenn "Single device":
   - Füge dein **FCM Token** aus der App ein (kopiere es aus Settings)
9. Klicke **"Review"** → **"Publish"**

✅ Notification sollte ankommen!

---

## 🧪 Test-Scenarios

### Test 1: Foreground Notification (App ist offen)
1. App ist geöffnet
2. Sende Test-Notification
3. ✅ Sollte als Browser/Android Notification erscheinen
4. ✅ In Settings sollte "Letzte Benachrichtigung" angezeigt werden

### Test 2: Background Notification (App ist geschlossen)
1. App schließen oder in Hintergrund
2. Sende Test-Notification
3. ✅ System Notification erscheint
4. ✅ Klick auf Notification öffnet App

---

## 🔍 Debugging

### Problem: Token wird nicht generiert (Web)

```bash
# Browser Console öffnen (F12)
# Suche nach Fehlern in Console Tab
```

**Mögliche Ursachen:**
- Service Worker nicht registriert
- VAPID Key fehlt in .env.local
- Browser blockiert Notifications

**Lösung:**
```bash
# Cache leeren
# Browser neu starten
# Seite neu laden
```

### Problem: Token wird nicht generiert (Android)

```bash
# Prüfe ob google-services.json vorhanden ist
ls android/app/google-services.json

# Sync erneut ausführen
npx cap sync android

# Logcat prüfen
adb logcat | grep -i "push\|fcm\|notification"
```

---

## 📊 Deine Firebase Credentials

**Projekt:** DEIN_FIREBASE_PROJEKT
**Project ID:** DEIN_FIREBASE_PROJECT_ID
**App ID:** DEINE_FIREBASE_APP_ID
**Package Name:** com.irajet.task

**VAPID Key (Web Push):**
```
DEIN_FIREBASE_VAPID_KEY
```

---

## 🎯 Nächste Schritte (Optional)

### 1. Token im Backend speichern

Wenn ein User sich anmeldet, speichere den Token:

```javascript
// In App.jsx - onTokenReceived Callback erweitern
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

onTokenReceived: async (token, platform) => {
  console.log('Token:', token);
  
  // In Firestore speichern
  if (userProfile.id) {
    await setDoc(doc(db, 'users', userProfile.id), {
      pushToken: token,
      platform: platform,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }
}
```

### 2. Cloud Function für automatisches Senden

```javascript
// Firebase Cloud Function
exports.sendTaskNotification = functions.firestore
  .document('tasks/{taskId}')
  .onCreate(async (snap, context) => {
    const task = snap.data();
    
    // User Token laden
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(task.assignedTo)
      .get();
    
    const token = userDoc.data()?.pushToken;
    if (!token) return;
    
    // Notification senden
    await admin.messaging().send({
      token: token,
      notification: {
        title: 'Neue Aufgabe!',
        body: task.title
      },
      data: {
        taskId: context.params.taskId,
        action: 'open_task'
      }
    });
  });
```

---

## ✅ Checkliste

- [ ] `npm install @capacitor/push-notifications` ausgeführt
- [ ] `npx cap sync android` ausgeführt
- [ ] Web-Version getestet (Token sichtbar)
- [ ] Android APK gebaut
- [ ] Android APK auf Gerät installiert
- [ ] Test-Notification via Firebase Console gesendet
- [ ] Foreground Notification funktioniert
- [ ] Background Notification funktioniert

---

## 🎉 Fertig!

Deine TaskRai App hat jetzt vollständige Push Notification Unterstützung! 🚀

**Bei Problemen:**
- Console Logs prüfen (Browser: F12)
- Android Logcat prüfen: `adb logcat | grep TaskRai`
- Firebase Console → Cloud Messaging → Metrics
