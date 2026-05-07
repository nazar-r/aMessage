"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapMessage = exports.normalizePublicKey = exports.getRoomId = exports.getPeerId = exports.getUserId = void 0;
const websockets_1 = require("@nestjs/websockets");
const getUserId = (payload) => {
    const userId = payload?.sub ?? payload?.id ?? payload?.userId;
    if (!userId) {
        throw new websockets_1.WsException('User not found');
    }
    return userId;
};
exports.getUserId = getUserId;
const getPeerId = (value) => {
    const peerId = Array.isArray(value) ? value[0] : value;
    return typeof peerId === 'string' && peerId.trim() ? peerId.trim() : null;
};
exports.getPeerId = getPeerId;
const getRoomId = (userId, peerId) => [userId, peerId].sort().join('-');
exports.getRoomId = getRoomId;
const normalizePublicKey = (publicKey) => {
    const normalizedKey = publicKey?.trim();
    if (!normalizedKey) {
        throw new websockets_1.WsException('Invalid public key');
    }
    const decodedKey = Buffer.from(normalizedKey, 'base64');
    if (decodedKey.length !== 32) {
        throw new websockets_1.WsException('Invalid public key length');
    }
    return normalizedKey;
};
exports.normalizePublicKey = normalizePublicKey;
const mapMessage = (message) => ({
    userId: message.userId,
    messageId: message.messageId,
    text: message.content,
    createdAt: message.createdAt,
});
exports.mapMessage = mapMessage;
//# sourceMappingURL=chats.gateway.utils.js.map