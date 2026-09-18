import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly usePrisma: PrismaService) { }

  dbSchema = `enum Role { USER ADMIN } model User { role Role @default(USER) userId String @id userName String email String? pubKey String? refreshToken String? createdAt DateTime @default(now()) messages Message[] contacts Contact[] @relation("userContacts") rooms RoomUser[] } model Room { roomId String @id createdAt DateTime @default(now()) messages Message[] participants RoomUser[] } model Contact { userId String contactId String createdAt DateTime @default(now()) user User @relation("userContacts", fields: [userId], references: [userId], onDelete: Cascade) @@id([userId, contactId]) } model RoomUser { roomId String userId String room Room @relation(fields: [roomId], references: [roomId], onDelete: Cascade) user User @relation(fields: [userId], references: [userId], onDelete: Cascade) @@id([roomId, userId]) } model Message { roomId String messageId String @id @default(uuid()) userId String content String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt user User @relation(fields: [userId], references: [userId], onDelete: Cascade) room Room @relation(fields: [roomId], references: [roomId], onDelete: Cascade) }`;
  geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;
  slopPrefix = 'SLOP:';

  stringifyResult = (data) => JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
  callGemini = async (promptText) => {
    const response = await fetch(this.geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  };

  firstRequest = (prompt, userId) => {
    return `Схема бази даних:\n${this.dbSchema}\n\nId користувача: ${userId}\n\nЗапит користувача: ${prompt}\n\nНадай відповідь згідно prompt. Якщо запит користувача НЕ стосується читання, аналізу, створення, оновлення чи видалення даних у наведеній схемі (наприклад, це привітання, загальне питання, прохання щось пояснити тощо) — не формуй SQL, а одразу дай користувачу коротку відповідь українською мовою, обов'язково розпочавши її рівно з префікса "${this.slopPrefix}" (без пробілу після двокрапки не обов'язково, просто на початку рядка). Якщо ж користувач запросить операцію з даними, їх аналіз або створення, оновлення чи видалення, сформуй один SQL запит (PostgreSQL) для виконання цього запиту, використовуючи наведену схему. Обов'язково фільтруй дані по userId, де це доцільно. У цьому випадку у відповідь віднеси лише сам SQL запит, без пояснень, без markdown форматування, без крапки з комою в кінці, і без префікса "${this.slopPrefix}".`;
  };

  finalRequest = (prompt, queryResult) => {
    return `Запит користувача: ${prompt}\n\nРезультат SQL запиту: ${this.stringifyResult(queryResult)}\n\nОстаточно сформуй зрозумілу відповідь користувачу. ВИКОРИСТОВУЙ СМАЙЛИКИ. Не використовуй інакші символи, окрім літер, крапки, коми, знаків оклику та знаків запитання.Якщо подано результат виконання до БД - українською мовою на основі цих даних.`;
  };

  retryRequest = (sql, error) => {
    return `Схема бази даних:\n${this.dbSchema}\n\nНевдало згенерований SQL:\n${sql}\n\nПомилка виконання SQL:\n${error}\n\nВиправ та переформатуй цей запит відповідно до схеми у коректний PostgreSQL SQL. Поверни лише SQL запит, без пояснень, без markdown форматування, без крапки з комою в кінці.`;
  };

  buildDBQuery = async (prompt, userId) => {
    const sqlPrompt = this.firstRequest(prompt, userId);
    const sqlQuery = await this.callGemini(sqlPrompt);

    return sqlQuery;
  };

  buildClientAnswer = async (prompt, queryResult) => {
    const answerPrompt = this.finalRequest(prompt, queryResult);
    const finalAnswer = await this.callGemini(answerPrompt);

    return finalAnswer;
  };

  getChatHistory = async (userId) => {
    const chatHistory = await this.usePrisma.$queryRaw`
    SELECT
      type,
      content,
      "createdAt"
    FROM "AIMessage"
    WHERE "chatId" = ${userId}
    ORDER BY "createdAt" ASC
  `;

    return { chatHistory };
  };

  useGemini = async (prompt, userId) => {
    const aiChat = await this.usePrisma.aIChat.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        chatId: userId,
      },
    });

    await this.usePrisma.aIMessage.create({
      data: {
        chatId: aiChat.chatId,
        type: 'prompt',
        content: prompt,
      },
    });

    const modelResponse = await this.buildDBQuery(prompt, userId);

    if (modelResponse.startsWith(this.slopPrefix)) {
      const directAnswer = modelResponse.slice(this.slopPrefix.length).trim();

      await this.usePrisma.aIMessage.create({
        data: {
          chatId: aiChat.chatId,
          type: 'response',
          content: directAnswer,
        },
      });

      return { answer: directAnswer };
    }

    const executeQuery = async () => {
      const queryResult = await this.usePrisma.$queryRawUnsafe(modelResponse);
      const answer = await this.buildClientAnswer(prompt, queryResult);

      await this.usePrisma.aIMessage.create({
        data: {
          chatId: aiChat.chatId,
          type: 'response',
          content: answer,
        },
      });

      return { answer };
    };

    const retryQuery = async (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const retryPrompt = this.retryRequest(modelResponse, errorMessage);
      const correctedSql = await this.callGemini(retryPrompt);
      const queryResult = await this.usePrisma.$queryRawUnsafe(correctedSql);
      const answer = await this.buildClientAnswer(prompt, queryResult);

      await this.usePrisma.aIMessage.create({
        data: {
          chatId: aiChat.chatId,
          type: 'response',
          content: answer,
        },
      });

      return { answer };
    };

    try {
      return await executeQuery();
    } catch (error) {
      return await retryQuery(error);
    }
  };
}