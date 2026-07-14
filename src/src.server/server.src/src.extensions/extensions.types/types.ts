export interface ExceptionResponseBody {
  message: string | string[];
  error?: string;
};

export interface JwtPayload {
  sub: string;
  exp: number;
};

export interface E2EEPublicKeyPayload {
  publicKey: string;
};

export interface E2EEPeerPublicKeyPayload {
  userId: string;
  publicKey: string;
};

export type UserStatus = 'online' | 'offline';

export type CachedUser = {
  sub: string;
  expMs: number;
};

export interface UserImage {
  userId: string;
  contactId: string;
};

export interface ChosenUser {
  userId: string;
  userName: string;
  isContact: boolean;
};

export interface UserContact {
  userId: string;
  contactId: string;
};

export interface ChatUser {
  userId: string;
  chatRoomId: string;
};

export interface UserContactImage {
  userId: string;
  userContactId: string;
};

export interface ContactImage {
  userId: string;
  userName: string;
  isContact: boolean;
};

export class SetUserContactDTO {
  contactId: string;
}