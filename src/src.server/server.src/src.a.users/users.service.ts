import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { RedisService } from '../src.b.redis/redis.service';
import type { AuthUser } from '../src.c.extensions/extensions.types/types.auth';
import type { UserContact, userPubKey, ChosenUser } from '../src.c.extensions/extensions.types/types.chats';

@Injectable()
export class UsersService {
  constructor(
    private readonly usePrisma: PrismaService,
    private readonly useRedis: RedisService,
  ) { }

  async getOrCreateUser(profile: AuthUser) {
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

  async getAllUsers(userId: string) {
    const cachedUsersList = await this.useRedis.getRedisData('users:list');
    const selectedUsers: { userId: string }[] = typeof cachedUsersList === 'string'
      ? JSON.parse(cachedUsersList)
      : await this.usePrisma.$queryRaw<{ userId: string }[]>
        ` 
          SELECT u."userId"
          FROM "User" u
          ORDER BY u."userName" DESC
          LIMIT 26
        `
        .then(async (setUsersList) => {
          await this.useRedis.setRedisData('users:list', JSON.stringify(setUsersList), 10);
          return setUsersList;
        });

    const selectedUserId = selectedUsers.map((user) => user.userId);
    return this.usePrisma.$queryRaw<ChosenUser[]>
      `
      SELECT u."userId", u."userName", u."lastSeen", EXISTS (
      SELECT 1
      FROM "Contact" c
      WHERE c."userId" = ${userId}
      AND c."contactId" = u."userId" ) AS "isContact"
      FROM "User" u
      WHERE u."userId" = ANY(${selectedUserId})
      AND u."userId" <> ${userId}
      ORDER BY u."userName" DESC
      LIMIT 25
    `;
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

  setUserPubKey(userId: string, userPubKey: string) {
    return this.usePrisma.user.update({
      where: { userId },
      data: {
        pubKey: userPubKey,
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