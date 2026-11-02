import { ChatEncryptionService } from "../../src.c.encryption/encryption.service";

export const lobbyCryptoLogic = async (chats: any[]) => {
    const result = await Promise.all(
        chats.map(async (chat) => {
            if (!chat.lastMessage) return chat;

            try {
                const encryptionService = new ChatEncryptionService(chat.userId);
                await encryptionService.init();

                return {
                    ...chat,
                    lastMessage: encryptionService.decryptRoomText(chat.lastMessage),
                };
            } catch {
                return chat;
            }
        })
    );

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

    return result;
};