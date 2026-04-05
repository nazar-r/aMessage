import sodium from "libsodium-wrappers";

export const E2EE_PREFIX = "box:v1:";
export const E2EE_MY_KEYPAIR_PK_STORAGE_KEY = "chat-e2ee-my-pk";
export const E2EE_MY_KEYPAIR_SK_STORAGE_KEY = "chat-e2ee-my-sk";
export const E2EE_PEER_PUBLIC_KEY_STORAGE_KEY = "chat-e2ee-peer-pk";

const b64 = sodium.base64_variants.ORIGINAL;

const encodeBase64 = (bytes: Uint8Array) => sodium.to_base64(bytes, b64);
const decodeBase64 = (value: string) => sodium.from_base64(value, b64);

export const waitForSodium = () => sodium.ready;

export type RoomKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export const ensureRoomKeyPair = (): RoomKeyPair => {
  if (typeof window === "undefined") {
    throw new Error("Room keypair can only be created in the browser");
  }

  const storedPk = localStorage.getItem(E2EE_MY_KEYPAIR_PK_STORAGE_KEY);
  const storedSk = localStorage.getItem(E2EE_MY_KEYPAIR_SK_STORAGE_KEY);

  if (storedPk && storedSk) {
    return {
      publicKey: decodeBase64(storedPk),
      secretKey: decodeBase64(storedSk),
    };
  }

  const pair = sodium.crypto_box_keypair();

  localStorage.setItem(E2EE_MY_KEYPAIR_PK_STORAGE_KEY, encodeBase64(pair.publicKey));
  localStorage.setItem(E2EE_MY_KEYPAIR_SK_STORAGE_KEY, encodeBase64(pair.privateKey));

  return {
    publicKey: pair.publicKey,
    secretKey: pair.privateKey,
  };
};

export const getStoredPeerPublicKey = (): Uint8Array | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(E2EE_PEER_PUBLIC_KEY_STORAGE_KEY);
  return stored ? decodeBase64(stored) : null;
};

export const setStoredPeerPublicKey = (publicKey: Uint8Array) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(E2EE_PEER_PUBLIC_KEY_STORAGE_KEY, encodeBase64(publicKey));
};

export const exportPublicKey = (publicKey: Uint8Array) => encodeBase64(publicKey);

export const importPublicKey = (publicKeyB64: string) => decodeBase64(publicKeyB64);

export const deriveSharedRoomKey = (
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array
) => {
  return sodium.crypto_box_beforenm(peerPublicKey, mySecretKey);
};

export const encryptRoomText = (plainText: string, sharedKey: Uint8Array) => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const cipher = sodium.crypto_box_easy_afternm(plainText, nonce, sharedKey);

  return (
    E2EE_PREFIX +
    JSON.stringify({
      n: encodeBase64(nonce),
      c: encodeBase64(cipher),
    })
  );
};

export const decryptRoomText = (wireText: string, sharedKey: Uint8Array | null) => {
  if (!wireText.startsWith(E2EE_PREFIX)) return wireText;
  if (!sharedKey) return "[Encrypted message]";

  try {
    const payload = JSON.parse(wireText.slice(E2EE_PREFIX.length)) as {
      n: string;
      c: string;
    };

    const nonce = decodeBase64(payload.n);
    const cipher = decodeBase64(payload.c);
    const opened = sodium.crypto_box_open_easy_afternm(cipher, nonce, sharedKey);

    return sodium.to_string(opened);
  } catch {
    return "[Encrypted message]";
  }
};