import sodium from "libsodium-wrappers";
export const E2EE_PREFIX = "box:v1:";
export const E2EE_MY_KEYPAIR_PK_STORAGE_KEY = "chat-e2ee-my-pk";
export const E2EE_MY_KEYPAIR_SK_STORAGE_KEY = "chat-e2ee-my-sk";

const getPeerKeyStorageKey = (peerWsId: string) =>
  `chat-e2ee-peer-pk:${peerWsId}`;

const b64 = sodium.base64_variants.ORIGINAL;

const encodeBase64 = (bytes: Uint8Array) => sodium.to_base64(bytes, b64);
const decodeBase64 = (value: string) => sodium.from_base64(value, b64);

export const waitForSodium = () => sodium.ready;
const DB_NAME = "e2ee-db";
const STORE_NAME = "kv";

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const idbGet = async (key: string): Promise<string | null> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
};

const idbSet = async (key: string, value: string) => {
  const db = await openDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};


export type RoomKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

let cachedKeyPair: RoomKeyPair | null = null;

export const ensureRoomKeyPair = async (): Promise<RoomKeyPair> => {
  if (typeof window === "undefined") {
    throw new Error("Room keypair can only be created in the browser");
  }

  if (cachedKeyPair) return cachedKeyPair;

  const storedPk = await idbGet(E2EE_MY_KEYPAIR_PK_STORAGE_KEY);
  const storedSk = await idbGet(E2EE_MY_KEYPAIR_SK_STORAGE_KEY);

  if (storedPk && storedSk) {
    cachedKeyPair = {
      publicKey: decodeBase64(storedPk),
      secretKey: decodeBase64(storedSk),
    };
    return cachedKeyPair;
  }

  const pair = sodium.crypto_box_keypair();

  await idbSet(E2EE_MY_KEYPAIR_PK_STORAGE_KEY, encodeBase64(pair.publicKey));
  await idbSet(E2EE_MY_KEYPAIR_SK_STORAGE_KEY, encodeBase64(pair.privateKey));

  cachedKeyPair = {
    publicKey: pair.publicKey,
    secretKey: pair.privateKey,
  };

  return cachedKeyPair;
};


export const getStoredPeerPublicKey = async (
  peerWsId: string
): Promise<Uint8Array | null> => {
  if (typeof window === "undefined") return null;

  const stored = await idbGet(getPeerKeyStorageKey(peerWsId));
  return stored ? decodeBase64(stored) : null;
};

export const setStoredPeerPublicKey = async (
  peerWsId: string,
  publicKey: Uint8Array
) => {
  if (typeof window === "undefined") return;

  await idbSet(getPeerKeyStorageKey(peerWsId), encodeBase64(publicKey));
};

export const exportPublicKey = (publicKey: Uint8Array) =>
  encodeBase64(publicKey);

export const importPublicKey = (publicKeyB64: string) =>
  decodeBase64(publicKeyB64);

export const deriveSharedRoomKey = (
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array
) => {
  return sodium.crypto_box_beforenm(peerPublicKey, mySecretKey);
};


export const encryptRoomText = (
  plainText: string,
  sharedKey: Uint8Array
) => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const cipher = sodium.crypto_box_easy_afternm(
    plainText,
    nonce,
    sharedKey
  );

  return (
    E2EE_PREFIX +
    JSON.stringify({
      n: encodeBase64(nonce),
      c: encodeBase64(cipher),
    })
  );
};

export const decryptRoomText = (
  wireText: string,
  sharedKey: Uint8Array | null
) => {
  if (!wireText.startsWith(E2EE_PREFIX)) return wireText;
  if (!sharedKey) return "[Encrypted message]";

  try {
    const payload = JSON.parse(
      wireText.slice(E2EE_PREFIX.length)
    ) as {
      n: string;
      c: string;
    };

    const nonce = decodeBase64(payload.n);
    const cipher = decodeBase64(payload.c);

    const opened = sodium.crypto_box_open_easy_afternm(
      cipher,
      nonce,
      sharedKey
    );

    return sodium.to_string(opened);
  } catch {
    return "[Encrypted message]";
  }
};