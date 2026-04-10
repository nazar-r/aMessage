import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { AuthUser } from "../src.extensions/extensions.types/auth.types";

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  findAllUsers(userId: string) {
    return this.prisma.user.findMany({
      where: {
        userId: { not: userId }
      },
      select: {
        userId: true,
        userName: true,
      },
    });
  }

  findOrCreateUser(profile: AuthUser) {
    if (!profile.userId) throw new UnauthorizedException({
      message: 'ID is missing in your Service profile',
      error: 'Unauthorized',
    });

    return this.prisma.user.upsert({
      where: { email: profile.email },
      update: { userName: profile.name || 'Unknown' },
      create: { email: profile.email, userId: profile.userId, userName: profile.name || 'Unknown' },
    });
  }

  updateRefreshToken(userId: string, refreshTokenHash: string) {
    return this.prisma.user.update({
      where: { userId: userId },
      data: { refreshToken: refreshTokenHash },
    });
  }
}