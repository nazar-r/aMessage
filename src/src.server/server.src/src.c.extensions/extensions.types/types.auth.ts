export interface AuthUser {
  userId: string;
  userEmail?: string;
  userName: string;
}

export type TBody = {
  content: string;
}

export type TReq = {
  user: {
    sub: string;
  }
}