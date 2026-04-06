export interface ExceptionResponseBody {
    message: string | string[];
    error?: string;
}
export interface JwtPayload {
    sub?: string;
    id?: string;
    userId?: string;
}
export interface E2EEPublicKeyPayload {
    publicKey: string;
}
export interface E2EEPeerPublicKeyPayload {
    userId: string;
    publicKey: string;
}
