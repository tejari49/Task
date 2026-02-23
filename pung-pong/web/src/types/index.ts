import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string;
  code: string;
  photoURL: string;
  status: "online" | "away" | "busy" | "invisible";
  statusMessage: string;
  presence: { lastSeenAt: Timestamp };
  createdAt: Timestamp;
}

export interface Friendship {
  id: string;
  aUid: string;
  bUid: string;
  createdAt: Timestamp;
  spamAEnabled: boolean;
  spamBEnabled: boolean;
  mutedA: boolean;
  mutedB: boolean;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: string;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  members: string[];
  createdAt: Timestamp;
  lastMessagePreview: string | null;
  lastMessageAt: Timestamp | null;
  lastMessageExpireAt?: Timestamp;
  turnUid: string;
  spamEnabled: boolean;
  lastNudgeAt?: Timestamp;
  lastNudgeBy?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderUid: string;
  type: "text" | "photo_once";
  text?: string;
  base64Photo?: string;
  createdAt: Timestamp;
  expireAt: Timestamp;
  state: string;
  viewState?: "unopened" | "opened" | "deleted";
}

export type StatusType = "online" | "away" | "busy" | "invisible";

export interface FriendWithProfile extends Friendship {
  friendProfile: UserProfile;
  chat?: Chat;
}

export const EMOTICONS: Record<string, string> = {
  ":)": "😊", ":(": "😢", ":D": "😄", ";)": "😉", ":P": "😛",
  ":O": "😮", "<3": "❤️", "XD": "🤣", "B)": "😎", ":/": "😕",
  ":*": "😘", ":'(": "😭", "^^": "😊", "(Y)": "👍", "(N)": "👎",
};
