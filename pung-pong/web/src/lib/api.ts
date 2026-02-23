import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

function c<D = unknown, R = unknown>(name: string) {
  return httpsCallable<D, R>(functions, name);
}

export const api = {
  setupUser:          c<{ displayName: string }, { code: string }>("setupUser"),
  lookupUserByCode:   c<{ code: string }, { uid: string; displayName: string; photoURL: string; status: string }>("lookupUserByCode"),
  sendFriendRequest:  c<{ toUid: string }, { status: string; friendshipId?: string }>("sendFriendRequest"),
  acceptFriendRequest:c<{ requestId: string }, { status: string }>("acceptFriendRequest"),
  rejectFriendRequest:c<{ requestId: string }, { status: string }>("rejectFriendRequest"),
  removeFriend:       c<{ friendUid: string }, { status: string }>("removeFriend"),
  blockUser:          c<{ blockedUid: string }, { status: string }>("blockUser"),
  unblockUser:        c<{ blockedUid: string }, { status: string }>("unblockUser"),
  sendMessage:        c<{ chatId: string; text?: string; type?: string; base64Photo?: string }, { messageId: string }>("sendMessage"),
  viewOncePhoto:      c<{ chatId: string; messageId: string }, { viewState: string; base64: string | null; shouldDelete?: boolean }>("viewOncePhoto"),
  deleteOncePhoto:    c<{ chatId: string; messageId: string }, { status: string }>("deleteOncePhoto"),
  toggleSpam:         c<{ friendUid: string; enabled: boolean }, { spamEnabled: boolean }>("toggleSpam"),
  sendNudge:          c<{ chatId: string }, { status: string }>("sendNudge"),
  updatePresence:     c<{ status?: string; statusMessage?: string }, { status: string }>("updatePresence"),
  registerFcmToken:   c<{ token: string }, { status: string }>("registerFcmToken"),
};
