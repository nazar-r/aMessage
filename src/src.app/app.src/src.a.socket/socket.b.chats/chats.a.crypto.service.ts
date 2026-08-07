import sodium from "libsodium-wrappers";
import type { E2EEPeerPublicKeyPayload, RoomKeyPair, } from "../../src.b.extensions/chats.types";
import type { MessageInterface } from "../../src.b.extensions/chats.types";

export class ChatEncryptionService {
  private static readonly E2EE_PREFIX = "box:v1:";
  private static readonly E2EE_MY_KEYPAIR_PK_STORAGE_KEY = "chat-e2ee-my-pk";
  private static readonly E2EE_MY_KEYPAIR_SK_STORAGE_KEY = "chat-e2ee-my-sk";
  private static readonly DB_NAME = "e2ee-db";
  private static readonly STORE_NAME = "kv";

  private static cachedKeyPair: RoomKeyPair | null = null;
  private readonly b64 = sodium.base64_variants.ORIGINAL;
  private readonly encryptedTextByMessageId = new Map<string, string>();

  private myKeyPair: RoomKeyPair | null = null;
  private sharedKey: Uint8Array | null = null;

  constructor(private readonly peerWsId: string) { }

  async init(): Promise<void> {
    await sodium.ready;
    this.myKeyPair = await this.ensureRoomKeyPair();

    if (!this.peerWsId) return;

    const storedPeerPublicKey = await this.getStoredPeerPublicKey(this.peerWsId);
    if (storedPeerPublicKey) {
      this.sharedKey = this.deriveSharedRoomKey(
        this.myKeyPair.secretKey,
        storedPeerPublicKey
      );
    }
  }

  isReady() {
    return this.sharedKey !== null;
  }

  getPublicKey() {
    if (!this.myKeyPair) return null;
    return this.exportPublicKey(this.myKeyPair.publicKey);
  }

  getSharedKey() {
    return this.sharedKey;
  }

  getMyKeyPair() {
    return this.myKeyPair;
  }

  async receivePeerPublicKey(payload: E2EEPeerPublicKeyPayload) {
    if (payload.userId !== this.peerWsId || !payload.publicKey || !this.myKeyPair)
      return false;

    const peerPublicKey = this.importPublicKey(payload.publicKey);
    await this.setStoredPeerPublicKey(this.peerWsId, peerPublicKey);

    this.sharedKey = this.deriveSharedRoomKey(
      this.myKeyPair.secretKey,
      peerPublicKey
    );

    return true;
  }

  cacheEncryptedText(messageId: string, wireText: string): void {
    this.encryptedTextByMessageId.set(messageId, wireText);
  }

  getCachedEncryptedText(messageId: string): string | null {
    return this.encryptedTextByMessageId.get(messageId) ?? null;
  }

  removeCachedEncryptedText(messageId: string): void {
    this.encryptedTextByMessageId.delete(messageId);
  }

  clear() {
    this.myKeyPair = null;
    this.sharedKey = null;
    this.encryptedTextByMessageId.clear();
  }

  encryptRoomText(plainText: string) {
    if (!this.sharedKey) {
      throw new Error("Shared room key is not ready");
    }

    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    const cipher = sodium.crypto_box_easy_afternm(plainText, nonce, this.sharedKey);

    return (ChatEncryptionService.E2EE_PREFIX + JSON.stringify({
        n: this.encodeBase64(nonce),
        c: this.encodeBase64(cipher),
      })
    );
  }

  decryptRoomText(wireText: string): string {
    if (!wireText.startsWith(ChatEncryptionService.E2EE_PREFIX)) return wireText;
    if (!this.sharedKey) return "[No shared key]";

    try {
      const payload = JSON.parse(
        wireText.slice(ChatEncryptionService.E2EE_PREFIX.length)
      ) as { n: string; c: string };

      const nonce = this.decodeBase64(payload.n);
      const cipher = this.decodeBase64(payload.c);

      const opened = sodium.crypto_box_open_easy_afternm(
        cipher,
        nonce,
        this.sharedKey
      );

      return sodium.to_string(opened);
    } catch {
      return "[Encrypted message]";
    }
  }

  decryptCachedMessage(messageId: string, fallbackWireText: string): string {
    const raw = this.getCachedEncryptedText(messageId) ?? fallbackWireText;
    return this.decryptRoomText(raw);
  }

  rehydrateMessage(message: MessageInterface): MessageInterface {
    return {
      ...message,
      content: this.decryptCachedMessage(message.messageId, message.content),
    };
  }

  rehydrateMessages(messages: MessageInterface[]): MessageInterface[] {
    return messages.map((message) => this.rehydrateMessage(message));
  }

  private async ensureRoomKeyPair(): Promise<RoomKeyPair> {
    if (typeof window === "undefined") {
      throw new Error("Room keypair can only be created in the browser");
    }

    if (ChatEncryptionService.cachedKeyPair) return ChatEncryptionService.cachedKeyPair;

    const storedPk = await this.idbGet(ChatEncryptionService.E2EE_MY_KEYPAIR_PK_STORAGE_KEY);
    const storedSk = await this.idbGet(ChatEncryptionService.E2EE_MY_KEYPAIR_SK_STORAGE_KEY);

    if (storedPk && storedSk) {
      ChatEncryptionService.cachedKeyPair = {
        publicKey: this.decodeBase64(storedPk),
        secretKey: this.decodeBase64(storedSk),
      };
      return ChatEncryptionService.cachedKeyPair;
    }

    const pair = sodium.crypto_box_keypair();

    await this.idbSet(
      ChatEncryptionService.E2EE_MY_KEYPAIR_PK_STORAGE_KEY,
      this.encodeBase64(pair.publicKey)
    );
    await this.idbSet(
      ChatEncryptionService.E2EE_MY_KEYPAIR_SK_STORAGE_KEY,
      this.encodeBase64(pair.privateKey)
    );

    ChatEncryptionService.cachedKeyPair = {
      publicKey: pair.publicKey,
      secretKey: pair.privateKey,
    };

    return ChatEncryptionService.cachedKeyPair;
  }

  private async getStoredPeerPublicKey(
    peerWsId: string
  ): Promise<Uint8Array | null> {
    if (typeof window === "undefined") return null;

    const stored = await this.idbGet(this.getPeerKeyStorageKey(peerWsId));
    return stored ? this.decodeBase64(stored) : null;
  }

  private async setStoredPeerPublicKey(
    peerWsId: string,
    publicKey: Uint8Array
  ): Promise<void> {
    if (typeof window === "undefined") return;

    await this.idbSet(
      this.getPeerKeyStorageKey(peerWsId),
      this.encodeBase64(publicKey)
    );
  }

  private exportPublicKey(publicKey: Uint8Array): string {
    return this.encodeBase64(publicKey);
  }

  private importPublicKey(publicKeyB64: string): Uint8Array {
    return this.decodeBase64(publicKeyB64);
  }

  private deriveSharedRoomKey(
    mySecretKey: Uint8Array,
    peerPublicKey: Uint8Array
  ): Uint8Array {
    return sodium.crypto_box_beforenm(peerPublicKey, mySecretKey);
  }

  private encodeBase64(bytes: Uint8Array): string {
    return sodium.to_base64(bytes, this.b64);
  }

  private decodeBase64(value: string): Uint8Array {
    return sodium.from_base64(value, this.b64);
  }

  private getPeerKeyStorageKey(peerWsId: string): string {
    return `chat-e2ee-peer-pk:${peerWsId}`;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(ChatEncryptionService.DB_NAME, 1);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(ChatEncryptionService.STORE_NAME)) {
          db.createObjectStore(ChatEncryptionService.STORE_NAME);
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async idbGet(key: string): Promise<string | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(ChatEncryptionService.STORE_NAME, "readonly");
      const store = tx.objectStore(ChatEncryptionService.STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private async idbSet(key: string, value: string): Promise<void> {
    const db = await this.openDB();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ChatEncryptionService.STORE_NAME, "readwrite");
      const store = tx.objectStore(ChatEncryptionService.STORE_NAME);

      store.put(value, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}