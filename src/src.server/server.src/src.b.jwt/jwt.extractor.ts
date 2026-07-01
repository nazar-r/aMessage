import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { type JwtPayload, type CachedUser } from '../src.extensions/extensions.types/types';

class JwtLruCache {
  private readonly map = new Map<string, CachedUser>();
  private readonly evictBatch: number;

  constructor(private readonly maxSize = 20_000) {
    this.evictBatch = Math.max(1, Math.floor(maxSize * 0.1));
  }

  get(token: string, now: number = Date.now()): CachedUser | null {
    const value = this.map.get(token);
    if (!value) return null;

    if (value.expMs <= now) {
      this.map.delete(token);
      return null;
    }

    return value;
  }

  set(token: string, value: CachedUser): void {
    if (this.map.has(token)) {
      this.map.delete(token);
    }

    this.map.set(token, value);

    if (this.map.size > this.maxSize) {
      const it = this.map.keys();
      for (let i = 0; i < this.evictBatch; i++) {
        const next = it.next();
        if (next.done) break;
        this.map.delete(next.value);
      }
    }
  }
}

const jwtCache = new JwtLruCache(20_000);

const EXPECTED_HEADER_B64 = base64UrlEncode(
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8'),
);

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

@Injectable()
export class JwtCheck implements CanActivate {
  private readonly secretBuf: Buffer;

  constructor() {
    const secret = process.env.JWT_SECRET ?? '';
    this.secretBuf = Buffer.from(secret, 'utf8');
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.secretBuf.length === 0) {
      throw new UnauthorizedException();
    }

    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException();
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

  private extractToken(req: any): string | null {
    const cookieToken = req?.cookies?.access_token;
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    const auth = req?.headers?.authorization;
    if (typeof auth !== 'string') return null;

    return auth.startsWith('Bearer ') ? auth.slice(7) : null;
  }

  private verifyJwtHs256(token: string, now: number): JwtPayload {
    const firstDot = token.indexOf('.');
    const secondDot = firstDot === -1 ? -1 : token.indexOf('.', firstDot + 1);

    if (
      firstDot <= 0 ||
      secondDot === -1 ||
      token.indexOf('.', secondDot + 1) !== -1
    ) {
      throw new UnauthorizedException();
    }

    const headerB64 = token.slice(0, firstDot);
    const payloadB64 = token.slice(firstDot + 1, secondDot);
    const signatureB64 = token.slice(secondDot + 1);

    if (headerB64 !== EXPECTED_HEADER_B64) {
      throw new UnauthorizedException();
    }

    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = createHmac('sha256', this.secretBuf)
      .update(signingInput)
      .digest();

    let actualSignature: Buffer;
    try {
      actualSignature = base64UrlToBuffer(signatureB64);
    } catch {
      throw new UnauthorizedException();
    }

    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      throw new UnauthorizedException();
    }

    const payload = this.decodeJsonPayload(payloadB64);

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedException();
    }

    if (payload.exp * 1000 <= now) {
      throw new UnauthorizedException();
    }

    return {
      sub: payload.sub,
      exp: payload.exp,
    };
  }

  private decodeJsonPayload(base64Url: string): Partial<JwtPayload> | null {
    try {
      const json = base64UrlToBuffer(base64Url).toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}