import * as admin from "firebase-admin";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/* ─── Helpers ─────────────────────────────────────────── */

function generateCode(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += c[Math.floor(Math.random() * c.length)];
  return code;
}

function fid(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

async function blocked(u1: string, u2: string) {
  const s = await db.collection("blocks")
    .where("blockerUid", "in", [u1, u2]).get();
  return s.docs.some(d =>
    (d.data().blockerUid === u1 && d.data().blockedUid === u2) ||
    (d.data().blockerUid === u2 && d.data().blockedUid === u1));
}

async function push(uid: string, title: string, body: string, data?: Record<string, string>) {
  const snap = await db.collection("fcmTokens").where("uid", "==", uid).get();
  const tokens = snap.docs.map(d => d.data().token as string);
  if (!tokens.length) return;
  try {
    const r = await messaging.sendEachForMulticast({
      tokens, notification: { title, body }, data: data || {},
      webpush: { fcmOptions: { link: "/" } },
    });
    r.responses.forEach((resp, i) => {
      if (!resp.success && (resp.error?.code === "messaging/invalid-registration-token" ||
        resp.error?.code === "messaging/registration-token-not-registered")) {
        db.collection("fcmTokens").where("token", "==", tokens[i]).get()
          .then(s => s.docs.forEach(d => d.ref.delete()));
      }
    });
  } catch (e) { console.error("Push error:", e); }
}

/* ─── Setup User ──────────────────────────────────────── */

export const setupUser = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { displayName } = req.data as { displayName: string };
  if (!displayName || displayName.trim().length < 2)
    throw new HttpsError("invalid-argument", "Name min 2 chars");

  const ref = db.collection("users").doc(req.auth.uid);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.code) {
    await ref.update({ displayName: displayName.trim() });
    return { code: snap.data()?.code };
  }

  let code = ""; let tries = 0;
  while (tries < 20) {
    code = generateCode();
    const ex = await db.collection("users").where("code", "==", code).limit(1).get();
    if (ex.empty) break;
    tries++;
  }
  if (tries >= 20) throw new HttpsError("internal", "Code generation failed");

  await ref.set({
    displayName: displayName.trim(), code,
    photoURL: req.auth.token.picture || "",
    status: "online", statusMessage: "",
    presence: { lastSeenAt: admin.firestore.FieldValue.serverTimestamp() },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { code };
});

/* ─── Lookup by Code ──────────────────────────────────── */

export const lookupUserByCode = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { code } = req.data as { code: string };
  if (!code) throw new HttpsError("invalid-argument", "Code required");

  const snap = await db.collection("users").where("code", "==", code.toUpperCase().trim()).limit(1).get();
  if (snap.empty) throw new HttpsError("not-found", "User not found");

  const u = snap.docs[0]; const d = u.data();
  if (u.id === req.auth.uid) throw new HttpsError("invalid-argument", "Cannot add yourself");
  if (await blocked(req.auth.uid, u.id)) throw new HttpsError("permission-denied", "Blocked");

  return { uid: u.id, displayName: d.displayName, photoURL: d.photoURL, status: d.status };
});

/* ─── Friend Request ──────────────────────────────────── */

export const sendFriendRequest = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { toUid } = req.data as { toUid: string };
  const from = req.auth.uid;
  if (from === toUid) throw new HttpsError("invalid-argument", "Cannot add yourself");
  if (await blocked(from, toUid)) throw new HttpsError("permission-denied", "Blocked");

  const f = fid(from, toUid);
  if ((await db.collection("friendships").doc(f).get()).exists)
    throw new HttpsError("already-exists", "Already friends");

  const existing = await db.collection("friendRequests")
    .where("fromUid", "==", from).where("toUid", "==", toUid).limit(1).get();
  if (!existing.empty) throw new HttpsError("already-exists", "Request sent");

  // Auto-accept reverse
  const reverse = await db.collection("friendRequests")
    .where("fromUid", "==", toUid).where("toUid", "==", from).limit(1).get();
  if (!reverse.empty) {
    await reverse.docs[0].ref.delete();
    await makeFriends(from, toUid);
    return { status: "accepted", friendshipId: f };
  }

  await db.collection("friendRequests").add({
    fromUid: from, toUid, status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const sn = await db.collection("users").doc(from).get();
  await push(toUid, "Friend Request", `${sn.data()?.displayName || "Someone"} wants to connect!`, { type: "friendRequest", fromUid: from });
  return { status: "pending" };
});

export const acceptFriendRequest = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { requestId } = req.data as { requestId: string };
  const r = db.collection("friendRequests").doc(requestId);
  const s = await r.get();
  if (!s.exists) throw new HttpsError("not-found", "Not found");
  if (s.data()!.toUid !== req.auth.uid) throw new HttpsError("permission-denied", "Not yours");
  await makeFriends(s.data()!.fromUid, s.data()!.toUid);
  await r.delete();
  return { status: "accepted" };
});

export const rejectFriendRequest = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { requestId } = req.data as { requestId: string };
  const r = db.collection("friendRequests").doc(requestId);
  const s = await r.get();
  if (!s.exists) throw new HttpsError("not-found", "Not found");
  if (s.data()!.toUid !== req.auth.uid) throw new HttpsError("permission-denied", "Not yours");
  await r.delete();
  return { status: "rejected" };
});

async function makeFriends(uid1: string, uid2: string) {
  const [a, b] = uid1 < uid2 ? [uid1, uid2] : [uid2, uid1];
  const id = `${a}_${b}`;
  const batch = db.batch();
  batch.set(db.collection("friendships").doc(id), {
    aUid: a, bUid: b,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    spamAEnabled: false, spamBEnabled: false, mutedA: false, mutedB: false,
  });
  batch.set(db.collection("chats").doc(id), {
    members: [a, b],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessagePreview: null, lastMessageAt: null,
    turnUid: a, spamEnabled: false,
  });
  await batch.commit();
}

/* ─── Remove / Block / Unblock ────────────────────────── */

export const removeFriend = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { friendUid } = req.data as { friendUid: string };
  const f = fid(req.auth.uid, friendUid);
  if (!(await db.collection("friendships").doc(f).get()).exists)
    throw new HttpsError("not-found", "Not friends");
  await db.collection("friendships").doc(f).delete();
  return { status: "removed" };
});

export const blockUser = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { blockedUid } = req.data as { blockedUid: string };
  const uid = req.auth.uid;
  const batch = db.batch();
  batch.set(db.collection("blocks").doc(`${uid}_${blockedUid}`), {
    blockerUid: uid, blockedUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const f = fid(uid, blockedUid);
  if ((await db.collection("friendships").doc(f).get()).exists)
    batch.delete(db.collection("friendships").doc(f));
  const r1 = await db.collection("friendRequests").where("fromUid", "==", uid).where("toUid", "==", blockedUid).get();
  const r2 = await db.collection("friendRequests").where("fromUid", "==", blockedUid).where("toUid", "==", uid).get();
  [...r1.docs, ...r2.docs].forEach(d => batch.delete(d.ref));
  await batch.commit();
  return { status: "blocked" };
});

export const unblockUser = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { blockedUid } = req.data as { blockedUid: string };
  await db.collection("blocks").doc(`${req.auth.uid}_${blockedUid}`).delete();
  return { status: "unblocked" };
});

/* ─── Send Message ────────────────────────────────────── */

export const sendMessage = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { chatId, text, type, base64Photo } = req.data as {
    chatId: string; text?: string; type?: string; base64Photo?: string;
  };
  const sender = req.auth.uid;
  const isPhoto = type === "photo_once" && base64Photo;
  if (!isPhoto && (!text || !text.trim())) throw new HttpsError("invalid-argument", "Empty message");

  // Validate base64 size (max ~700KB base64 → keeps doc under 1MiB)
  if (isPhoto && base64Photo && base64Photo.length > 700000)
    throw new HttpsError("invalid-argument", "Photo too large. Max ~500KB after compression.");

  const chatRef = db.collection("chats").doc(chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) throw new HttpsError("not-found", "Chat not found");
  const chat = chatSnap.data()!;
  if (!chat.members.includes(sender)) throw new HttpsError("permission-denied", "Not member");

  const other = chat.members.find((m: string) => m !== sender);
  if (await blocked(sender, other)) throw new HttpsError("permission-denied", "Blocked");

  const f = fid(sender, other);
  const fSnap = await db.collection("friendships").doc(f).get();
  if (!fSnap.exists) throw new HttpsError("permission-denied", "Not friends");
  const fd = fSnap.data()!;

  const spam = fd.spamAEnabled && fd.spamBEnabled;
  if (!spam && chat.turnUid !== sender)
    throw new HttpsError("failed-precondition", "Not your turn. Wait for reply.");

  const now = admin.firestore.Timestamp.now();
  const expireAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 48 * 60 * 60 * 1000);
  const msgRef = chatRef.collection("messages").doc();
  const preview = isPhoto ? "📷 Photo" : (text || "").trim().substring(0, 50);

  const msgData: Record<string, any> = {
    chatId, senderUid: sender,
    type: isPhoto ? "photo_once" : "text",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expireAt, state: "sent",
  };
  if (isPhoto) {
    msgData.base64Photo = base64Photo;
    msgData.viewState = "unopened";
  } else {
    msgData.text = (text || "").trim();
  }

  const batch = db.batch();
  batch.set(msgRef, msgData);
  const chatUpdate: Record<string, any> = {
    lastMessagePreview: preview,
    lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    lastMessageExpireAt: expireAt,
  };
  if (!spam) chatUpdate.turnUid = other;
  batch.update(chatRef, chatUpdate);
  await batch.commit();

  // Push
  const muted = (fd.aUid === other && fd.mutedA) || (fd.bUid === other && fd.mutedB);
  if (!muted) {
    const sn = await db.collection("users").doc(sender).get();
    const name = sn.data()?.displayName || "Someone";
    const body = isPhoto ? "Sent you a photo 📷" : (text || "").trim().substring(0, 100);
    await push(other, name, body, { type: isPhoto ? "photo" : "message", chatId });
  }
  return { messageId: msgRef.id };
});

/* ─── View / Delete Once-Photo ────────────────────────── */

export const viewOncePhoto = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { chatId, messageId } = req.data as { chatId: string; messageId: string };
  const msgRef = db.collection("chats").doc(chatId).collection("messages").doc(messageId);

  return db.runTransaction(async tx => {
    const snap = await tx.get(msgRef);
    if (!snap.exists) throw new HttpsError("not-found", "Not found");
    const d = snap.data()!;
    if (d.type !== "photo_once") throw new HttpsError("invalid-argument", "Not a photo");
    if (d.viewState === "deleted") return { viewState: "deleted", base64: null };

    if (d.viewState === "unopened") {
      tx.update(msgRef, {
        viewState: "opened",
        openedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { viewState: "opened", base64: d.base64Photo };
    }
    // Already opened → mark for delete
    return { viewState: "opened", base64: null, shouldDelete: true };
  });
});

export const deleteOncePhoto = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { chatId, messageId } = req.data as { chatId: string; messageId: string };
  const ref = db.collection("chats").doc(chatId).collection("messages").doc(messageId);
  const snap = await ref.get();
  if (!snap.exists) return { status: "already_deleted" };
  await ref.update({
    viewState: "deleted",
    base64Photo: admin.firestore.FieldValue.delete(),
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { status: "deleted" };
});

/* ─── Toggle Spam ─────────────────────────────────────── */

export const toggleSpam = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { friendUid, enabled } = req.data as { friendUid: string; enabled: boolean };
  const f = fid(req.auth.uid, friendUid);
  const ref = db.collection("friendships").doc(f);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Not friends");
  const d = snap.data()!;
  const isA = d.aUid === req.auth.uid;
  await ref.update(isA ? { spamAEnabled: enabled } : { spamBEnabled: enabled });
  const updated = (await ref.get()).data()!;
  const spamEnabled = updated.spamAEnabled && updated.spamBEnabled;
  await db.collection("chats").doc(f).update({ spamEnabled });
  return { spamEnabled };
});

/* ─── Nudge ───────────────────────────────────────────── */

export const sendNudge = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { chatId } = req.data as { chatId: string };
  const sender = req.auth.uid;
  const snap = await db.collection("chats").doc(chatId).get();
  if (!snap.exists) throw new HttpsError("not-found", "Chat not found");
  const c = snap.data()!;
  if (!c.members.includes(sender)) throw new HttpsError("permission-denied", "Not member");
  const last = c.lastNudgeAt?.toMillis() || 0;
  if (Date.now() - last < 30000) throw new HttpsError("resource-exhausted", "Wait 30s");
  await db.collection("chats").doc(chatId).update({
    lastNudgeAt: admin.firestore.FieldValue.serverTimestamp(),
    lastNudgeBy: sender,
  });
  const other = c.members.find((m: string) => m !== sender);
  const sn = await db.collection("users").doc(sender).get();
  await push(other, `${sn.data()?.displayName || "Someone"} nudged you! 👋`, "Hey!", { type: "nudge", chatId });
  return { status: "sent" };
});

/* ─── Presence ────────────────────────────────────────── */

export const updatePresence = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { status, statusMessage } = req.data as { status?: string; statusMessage?: string };
  const up: Record<string, any> = { "presence.lastSeenAt": admin.firestore.FieldValue.serverTimestamp() };
  if (status) up.status = status;
  if (statusMessage !== undefined) up.statusMessage = statusMessage;
  await db.collection("users").doc(req.auth.uid).update(up);
  return { status: "ok" };
});

/* ─── FCM Token ───────────────────────────────────────── */

export const registerFcmToken = onCall({ region: "europe-west1" }, async (req: CallableRequest) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Login required");
  const { token } = req.data as { token: string };
  if (!token) throw new HttpsError("invalid-argument", "Token required");
  await db.collection("fcmTokens").doc(token).set({
    uid: req.auth.uid, token,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { status: "registered" };
});

/* ─── Scheduled Cleanup (48h) ─────────────────────────── */

export const cleanupExpiredMessages = onSchedule({
  schedule: "every 60 minutes", region: "europe-west1", timeoutSeconds: 540,
}, async () => {
  const now = admin.firestore.Timestamp.now();
  let total = 0;
  let q = db.collectionGroup("messages").where("expireAt", "<=", now).limit(200);

  while (true) {
    const snap = await q.get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    total += snap.docs.length;
    if (snap.docs.length < 200) break;
    q = db.collectionGroup("messages").where("expireAt", "<=", now)
      .startAfter(snap.docs[snap.docs.length - 1]).limit(200);
  }

  // Scrub expired chat previews
  const chats = await db.collection("chats").where("lastMessageExpireAt", "<=", now).get();
  if (!chats.empty) {
    const batch = db.batch();
    chats.docs.forEach(d => batch.update(d.ref, {
      lastMessagePreview: "Messages expired",
      lastMessageExpireAt: admin.firestore.FieldValue.delete(),
    }));
    await batch.commit();
  }
  console.log(`Cleanup: ${total} messages deleted`);
});
