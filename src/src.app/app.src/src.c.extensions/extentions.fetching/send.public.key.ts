import { ChatEncryptionService } from "../../src.c.encryption/encryption.service";

export const sendPublicKey = async () => {
    const encryptionService = new ChatEncryptionService("");
    await encryptionService.init();
    const publicKey = encryptionService.getPublicKey();

    if (publicKey) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/users/e2ee-pubkey`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                publicKey,
            }),
        });
    }
};