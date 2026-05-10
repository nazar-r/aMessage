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
      orderBy: {
        userName: 'desc',
      },
      select: {
        userId: true,
        userName: true,
      },
    });
  }
  async findOrCreateUser(profile: AuthUser) {
    if (!profile.userId) {
      throw new UnauthorizedException({
        message: 'ID is missing in your Service profile',
        error: 'Unauthorized',
      });
    }

    if (!profile.email) {
      throw new UnauthorizedException({
        message: 'Email is missing in your Service profile',
        error: 'Unauthorized',
      });
    }

    const user = await this.prisma.user.upsert({
      where: { email: profile.email },
      update: {
        userName: profile.name || 'Unknown',
        userId: profile.userId,
      },
      create: {
        email: profile.email,
        userId: profile.userId,
        userName: profile.name || 'Unknown',
      },
    });

    return {
      ...user,
      name: user.userName,
    };
  }
}