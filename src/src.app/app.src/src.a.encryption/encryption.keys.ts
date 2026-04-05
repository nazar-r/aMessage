import sodium from "libsodium-wrappers";
import type { KeyPair, EncryptedMessage } from "../src.a.tsx/tsx.extensions/types";

export const initSodium = async () => {
  await sodium.ready;
};

export const generateKeyPair = (): KeyPair => {
  const keyPair = sodium.crypto_box_keypair();
  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
};

export const encryptMessage = (
  message: string,
  receiverPublicKey: Uint8Array,
  senderKeyPair: KeyPair
): EncryptedMessage => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(message);
  const cipher = sodium.crypto_box_easy(messageBytes, nonce, receiverPublicKey, senderKeyPair.privateKey);

  return {
    cipher: sodium.to_base64(cipher),
    nonce: sodium.to_base64(nonce),
    senderPublicKey: sodium.to_base64(senderKeyPair.publicKey),
  };
};

export const decryptMessage = (
  encrypted: EncryptedMessage,
  receiverPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array
): string => {
  const cipher = sodium.from_base64(encrypted.cipher);
  const nonce = sodium.from_base64(encrypted.nonce);
  const decrypted = sodium.crypto_box_open_easy(cipher, nonce, senderPublicKey, receiverPrivateKey);
  return sodium.to_string(decrypted);
};