import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { RedisService } from '../src.b.redis/redis.service';
import type { UserContact, ChosenUser, ContactImage } from '../src.extensions/extensions.types/types';
import type { AuthUser } from '../src.extensions/extensions.types/auth.types';

@Injectable()
export class UsersService {
  constructor(
    private readonly usePrisma: PrismaService,
    private readonly useRedis: RedisService,
  ) { }

  async findOrCreateUser(profile: AuthUser) {
    const user = await this.usePrisma.user.upsert({
      where: { userId: profile.userId },
      update: {
        userId: profile.userId,
        email: profile.userEmail,
        userName: profile.userName,
      },
      create: {
        userId: profile.userId,
        email: profile.userEmail,
        userName: profile.userName,
      },
    });

    return {
      ...user,
      name: user.userName,
    };
  }

  async findAllUsers(userId: string) {
    const cacheKey = `users:list:${userId}`;
    const cachedUsers = await this.useRedis.getRedisData(cacheKey);

    if (typeof cachedUsers === 'string') {
      return JSON.parse(cachedUsers) as ChosenUser[];
    }

    const chosenUsers = await this.usePrisma.$queryRaw<ChosenUser[]>`
      SELECT
        u."userId",
        u."userName",
        EXISTS (
           SELECT 1
           FROM "Contact" c
           WHERE c."userId" = ${userId}
             AND c."contactId" = u."userId"
       ) AS "isContact"
       FROM "User" u
       WHERE u."userId" <> ${userId}
       LIMIT 25;
    `;

    await this.useRedis.setRedisData(cacheKey, JSON.stringify(chosenUsers), 30);
    return chosenUsers;
  }

  setUserContact(userContact: UserContact) {
    return this.usePrisma.contact.upsert({
      where: {
        userId_contactId: {
          userId: userContact.userId,
          contactId: userContact.contactId,
        },
      },
      update: {},
      create: {
        userId: userContact.userId,
        contactId: userContact.contactId,
      },
    });
  }

  deleteUserContact(userContact: UserContact) {
    return this.usePrisma.contact.delete({
      where: {
        userId_contactId: {
          userId: userContact.userId,
          contactId: userContact.contactId,
        },
      },
    });
  }
}