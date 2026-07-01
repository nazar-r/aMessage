"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtCheck = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
class JwtLruCache {
    constructor(maxSize = 20_000) {
        this.maxSize = maxSize;
        this.map = new Map();
        this.evictBatch = Math.max(1, Math.floor(maxSize * 0.1));
    }
    get(token, now = Date.now()) {
        const value = this.map.get(token);
        if (!value)
            return null;
        if (value.expMs <= now) {
            this.map.delete(token);
            return null;
        }
        return value;
    }
    set(token, value) {
        if (this.map.has(token)) {
            this.map.delete(token);
        }
        this.map.set(token, value);
        if (this.map.size > this.maxSize) {
            const it = this.map.keys();
            for (let i = 0; i < this.evictBatch; i++) {
                const next = it.next();
                if (next.done)
                    break;
                this.map.delete(next.value);
            }
        }
    }
}
const jwtCache = new JwtLruCache(20_000);
const EXPECTED_HEADER_B64 = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8'));
function base64UrlEncode(buf) {
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
function base64UrlToBuffer(input) {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
}
let JwtCheck = class JwtCheck {
    constructor() {
        const secret = process.env.JWT_SECRET ?? '';
        this.secretBuf = Buffer.from(secret, 'utf8');
    }
    canActivate(context) {
        if (this.secretBuf.length === 0) {
            throw new common_1.UnauthorizedException();
        }
        const req = context.switchToHttp().getRequest();
        const token = this.extractToken(req);
        if (!token) {
            throw new common_1.UnauthorizedException();
        }
        const now = Date.now();
        const cached = jwtCache.get(token, now);
        if (cached) {
            req.user = { sub: cached.sub };
            return true;
        }
        const payload = this.verifyJwtHs256(token, now);
        req.user = { sub: payload.sub };
        jwtCache.set(token, {
            sub: payload.sub,
            expMs: payload.exp * 1000,
        });
        return true;
    }
    extractToken(req) {
        const cookieToken = req?.cookies?.access_token;
        if (typeof cookieToken === 'string' && cookieToken.length > 0) {
            return cookieToken;
        }
        const auth = req?.headers?.authorization;
        if (typeof auth !== 'string')
            return null;
        return auth.startsWith('Bearer ') ? auth.slice(7) : null;
    }
    verifyJwtHs256(token, now) {
        const firstDot = token.indexOf('.');
        const secondDot = firstDot === -1 ? -1 : token.indexOf('.', firstDot + 1);
        if (firstDot <= 0 ||
            secondDot === -1 ||
            token.indexOf('.', secondDot + 1) !== -1) {
            throw new common_1.UnauthorizedException();
        }
        const headerB64 = token.slice(0, firstDot);
        const payloadB64 = token.slice(firstDot + 1, secondDot);
        const signatureB64 = token.slice(secondDot + 1);
        if (headerB64 !== EXPECTED_HEADER_B64) {
            throw new common_1.UnauthorizedException();
        }
        const signingInput = `${headerB64}.${payloadB64}`;
        const expectedSignature = (0, node_crypto_1.createHmac)('sha256', this.secretBuf)
            .update(signingInput)
            .digest();
        let actualSignature;
        try {
            actualSignature = base64UrlToBuffer(signatureB64);
        }
        catch {
            throw new common_1.UnauthorizedException();
        }
        if (expectedSignature.length !== actualSignature.length ||
            !(0, node_crypto_1.timingSafeEqual)(expectedSignature, actualSignature)) {
            throw new common_1.UnauthorizedException();
        }
        const payload = this.decodeJsonPayload(payloadB64);
        if (!payload ||
            typeof payload.sub !== 'string' ||
            typeof payload.exp !== 'number') {
            throw new common_1.UnauthorizedException();
        }
        if (payload.exp * 1000 <= now) {
            throw new common_1.UnauthorizedException();
        }
        return {
            sub: payload.sub,
            exp: payload.exp,
        };
    }
    decodeJsonPayload(base64Url) {
        try {
            const json = base64UrlToBuffer(base64Url).toString('utf8');
            return JSON.parse(json);
        }
        catch {
            return null;
        }
    }
};
exports.JwtCheck = JwtCheck;
exports.JwtCheck = JwtCheck = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JwtCheck);
//# sourceMappingURL=jwt.extractor.js.map