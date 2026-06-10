import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { UserImage } from "../src.extensions/extensions.types/types"
import type { AuthUser } from "../src.extensions/extensions.types/auth.types";

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

async findAllUsers(userId: string) {
  const [users, contacts] = await Promise.all([
    this.prisma.user.findMany({
      where: {
        userId: { not: userId },
      },
      orderBy: {
        userName: 'desc',
      },
      select: {
        userId: true,
        userName: true,
      },
    }),
    this.prisma.contact.findMany({
      where: { userId },
      select: { contactId: true },
    }),
  ]);

  const contactsArray = new Set(contacts.map(c => c.contactId));

  return users.map(usersArray => ({
    ...usersArray,
    isContact: contactsArray.has(usersArray.userId),
  }));
}

  setUserContact(usersContact: UserImage) {
    return this.prisma.contact.upsert({
      where: {
        userId_contactId: {
          userId: usersContact.userId,
          contactId: usersContact.contactId,
        },
      },
      update: {},
      create: {
        userId: usersContact.userId,
        contactId: usersContact.contactId,
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