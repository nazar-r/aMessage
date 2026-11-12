import sodium from "libsodium-wrappers";
import type { E2EEPeerPublicKeyPayload, RoomKeyPair, MessageInterface } from "../src.c.extensions/extentions.types/chats.types";

export class ChatEncryptionService {
  private static readonly E2EE_PREFIX = "box:v1:";
  private static readonly E2EE_MY_KEYPAIR_PK_STORAGE_KEY = "chat-e2ee-my-pk";
  private static readonly E2EE_MY_KEYPAIR_SK_STORAGE_KEY = "chat-e2ee-my-sk";
  private static readonly DB_NAME = "e2ee-db";
  private static readonly STORE_NAME = "kv";

  private static cachedKeyPair: RoomKeyPair | null = null;
  private static instanceCounter = 0; // DEBUG
  private readonly b64 = sodium.base64_variants.ORIGINAL;
  private readonly encryptedTextByMessageId = new Map<string, string>();

  private myKeyPair: RoomKeyPair | null = null;
  private sharedKey: Uint8Array | null = null;
  private lastPeerPk: Uint8Array | null = null; // DEBUG: який peer pk використано для sharedKey
  private readonly instanceId = ++ChatEncryptionService.instanceCounter; // DEBUG

  constructor(private readonly peerWsId: string) {
    // DEBUG: консоль -> window.__e2ee.debugFingerprints()
    if (typeof window !== "undefined") (window as any).__e2ee = this;
    this.log("constructed", { peerWsId });
  }

  // ===================== DEBUG =====================
  private fp(b: Uint8Array | null | undefined): string | null {
    return b ? sodium.to_hex(sodium.crypto_generichash(8, b, null)) : null;
  }

  private tag(): string {
    const pk = this.myKeyPair ? this.encodeBase64(this.myKeyPair.publicKey).slice(0, 6) : "nokey";
    return `[E2EE#${this.instanceId}:${pk}]`;
  }

  private log(msg: string, data?: unknown) {
    console.log(this.tag(), msg, data ?? "");
  }

  debugFingerprints() {
    const kp = this.myKeyPair;
    const out = {
      instance: this.instanceId,
      myPkB64: kp ? this.encodeBase64(kp.publicKey) : null,
      myPkFp: this.fp(kp?.publicKey),
      pairValid: kp
        ? sodium.memcmp(sodium.crypto_scalarmult_base(kp.secretKey), kp.publicKey)
        : null,
      peerWsId: this.peerWsId,
      peerPkB64: this.lastPeerPk ? this.encodeBase64(this.lastPeerPk) : null,
      peerPkFp: this.fp(this.lastPeerPk),
      sharedFp: this.fp(this.sharedKey),
    };
    console.log(this.tag(), "FINGERPRINTS", out);
    return out;
  }

  /** Самоперевірка власного шифрування (window.__e2ee.selfTest()) */
  selfTest() {
    try {
      const w = this.encryptRoomText("x");
      const r = this.decryptRoomText(w);
      console.log(this.tag(), "SELFTEST", r === "x" ? "OK" : `FAIL got=${r}`);
      return r === "x";
    } catch (e) {
      console.log(this.tag(), "SELFTEST threw", e);
      return false;
    }
  }
  // =================================================

  async init(): Promise<void> {
    await sodium.ready;
    this.myKeyPair = await this.ensureRoomKeyPair();
    this.log("init: keypair ready", this.debugFingerprints());

    if (!this.peerWsId) {
      this.log("init: NO peerWsId, skip");
      return;
    }

    const storedPeerPublicKey = await this.getStoredPeerPublicKey(this.peerWsId);
    this.log("init: stored peer pk from IDB", {
      found: !!storedPeerPublicKey,
      b64: storedPeerPublicKey ? this.encodeBase64(storedPeerPublicKey) : null,
    });

    if (storedPeerPublicKey) {
      this.lastPeerPk = storedPeerPublicKey;
      this.sharedKey = this.deriveSharedRoomKey(
        this.myKeyPair.secretKey,
        storedPeerPublicKey
      );
      this.log("init: sharedKey from STORED peer pk", this.debugFingerprints());
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
    const mine = this.getPublicKey();
    this.log("recv: payload", {
      payloadUserId: payload.userId,
      payloadUserIdType: typeof payload.userId,
      expectedPeer: this.peerWsId,
      expectedPeerType: typeof this.peerWsId,
      idEqualStrict: payload.userId === this.peerWsId,
      recvPk: payload.publicKey,
      myPk: mine,
      isMyOwnKey: payload.publicKey === mine,
      hasKeyPair: !!this.myKeyPair,
    });

    if (payload.userId !== this.peerWsId || !payload.publicKey || !this.myKeyPair) {
      this.log("recv: REJECTED", {
        reasonUserId: payload.userId !== this.peerWsId,
        reasonNoKey: !payload.publicKey,
        reasonNoKeyPair: !this.myKeyPair,
      });
      return false;
    }

    const peerPublicKey = this.importPublicKey(payload.publicKey);
    this.log("recv: decoded peer pk length", peerPublicKey.length); // має бути 32

    await this.setStoredPeerPublicKey(this.peerWsId, peerPublicKey);

    const prevShared = this.fp(this.sharedKey);
    this.lastPeerPk = peerPublicKey;
    this.sharedKey = this.deriveSharedRoomKey(
      this.myKeyPair.secretKey,
      peerPublicKey
    );

    this.log("recv: ACCEPTED", {
      sharedBefore: prevShared,
      sharedAfter: this.fp(this.sharedKey),
      changed: prevShared !== this.fp(this.sharedKey),
    });
    this.debugFingerprints();

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
    this.log("clear() called");
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

    this.log("ENCRYPT", { sharedFp: this.fp(this.sharedKey), peerPkFp: this.fp(this.lastPeerPk), len: plainText.length });

    return (ChatEncryptionService.E2EE_PREFIX + JSON.stringify({
      n: this.encodeBase64(nonce),
      c: this.encodeBase64(cipher),
    })
    );
  }

  decryptRoomText(wireText: string): string {
    if (!wireText.startsWith(ChatEncryptionService.E2EE_PREFIX)) return wireText;
    if (!this.sharedKey) {
      this.log("DECRYPT: no sharedKey yet");
      return "[2121]";
    }

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
    } catch (e) {
      console.error(this.tag(), "DECRYPT FAIL", {
        err: e instanceof Error ? `${e.name}: ${e.message}` : e,
        wireText,
        sharedFp: this.fp(this.sharedKey),
        peerPkFp: this.fp(this.lastPeerPk),
        myPkFp: this.fp(this.myKeyPair?.publicKey),
      });
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

    if (ChatEncryptionService.cachedKeyPair) {
      this.log("keypair: from STATIC CACHE");
      return ChatEncryptionService.cachedKeyPair;
    }

    const storedPk = await this.idbGet(ChatEncryptionService.E2EE_MY_KEYPAIR_PK_STORAGE_KEY);
    const storedSk = await this.idbGet(ChatEncryptionService.E2EE_MY_KEYPAIR_SK_STORAGE_KEY);

    if (storedPk && storedSk) {
      ChatEncryptionService.cachedKeyPair = {
        publicKey: this.decodeBase64(storedPk),
        secretKey: this.decodeBase64(storedSk),
      };
      this.log("keypair: LOADED from IDB", { pk: storedPk });
      return ChatEncryptionService.cachedKeyPair;
    }

    const pair = sodium.crypto_box_keypair();
    this.log("keypair: GENERATED NEW", { pk: this.encodeBase64(pair.publicKey) });

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