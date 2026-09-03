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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../src.b.prisma/prisma.service");
const config_1 = require("@nestjs/config");
const dbSchema = `
enum Role { USER ADMIN }
model User { role Role @default(USER) userId String @id userName String email String? pubKey String? refreshToken String? createdAt DateTime @default(now()) messages Message[] contacts Contact[] @relation("userContacts") rooms RoomUser[] }
model Room { roomId String @id createdAt DateTime @default(now()) messages Message[] participants RoomUser[] }
model Contact { userId String contactId String createdAt DateTime @default(now()) user User @relation("userContacts", fields: [userId], references: [userId], onDelete: Cascade) @@id([userId, contactId]) }
model RoomUser { roomId String userId String room Room @relation(fields: [roomId], references: [roomId], onDelete: Cascade) user User @relation(fields: [userId], references: [userId], onDelete: Cascade) @@id([roomId, userId]) }
model Message { roomId String messageId String @id @default(uuid()) userId String content String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt user User @relation(fields: [userId], references: [userId], onDelete: Cascade) room Room @relation(fields: [roomId], references: [roomId], onDelete: Cascade) }
`;
const SLOP_PREFIX = 'SLOP:';
const stringifyResult = (data) => JSON.stringify(data, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
let SearchService = class SearchService {
    constructor(usePrisma, configService) {
        this.usePrisma = usePrisma;
        this.configService = configService;
        this.buildSqlPrompt = (prompt, userId) => {
            return `Схема бази даних:\n${dbSchema}\n\nId користувача: ${userId}\n\nЗапит користувача: ${prompt}\n\nНадай відповідь згідно prompt, якщо відповідь беззмістовна, ігноруй наступну інструкцію. Якщо запит користувача НЕ стосується читання, аналізу, створення, оновлення чи видалення даних у наведеній схемі (наприклад, це привітання, загальне питання, прохання щось пояснити тощо) — не формуй SQL, а одразу дай користувачу коротку відповідь українською мовою, обов'язково розпочавши її рівно з префікса "${SLOP_PREFIX}" (без пробілу після двокрапки не обов'язково, просто на початку рядка). Якщо ж користувач запросить операцію з даними, їх аналіз або створення, оновлення чи видалення, сформуй один SQL запит (PostgreSQL) для виконання цього запиту, використовуючи наведену схему. Обов'язково фільтруй дані по userId, де це доцільно. У цьому випадку у відповідь віднеси лише сам SQL запит, без пояснень, без markdown форматування, без крапки з комою в кінці, і без префікса "${SLOP_PREFIX}".`;
        };
        this.buildAnswerPrompt = (prompt, queryResult) => {
            return `Запит користувача: ${prompt}\n\nРезультат SQL запиту: ${stringifyResult(queryResult)}\n\nОстаточно сформуй зрозумілу відповідь користувачу. Якщо подано результат виконання до БД - українською мовою на основі цих даних.`;
        };
        this.callGemini = async (promptText) => {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${this.configService.get('GEMINI_API_KEY')}`;
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.configService.get('GEMINI_API_KEY'),
                },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
            });
            const data = await response.json();
            if (!response.ok || !data.candidates) {
                console.error('Gemini status:', response.status);
                console.error('Gemini response:', JSON.stringify(data));
                throw new Error('Gemini API request failed');
            }
            return data.candidates[0].content.parts[0].text.trim();
        };
        this.generateSqlQuery = async (prompt, userId) => {
            const sqlPrompt = this.buildSqlPrompt(prompt, userId);
            const sqlQuery = await this.callGemini(sqlPrompt);
            return sqlQuery;
        };
        this.generateFinalAnswer = async (prompt, queryResult) => {
            const answerPrompt = this.buildAnswerPrompt(prompt, queryResult);
            const finalAnswer = await this.callGemini(answerPrompt);
            return finalAnswer;
        };
        this.processSearch = async (prompt, userId) => {
            const modelResponse = await this.generateSqlQuery(prompt, userId);
            if (modelResponse.startsWith(SLOP_PREFIX)) {
                const directAnswer = modelResponse.slice(SLOP_PREFIX.length).trim();
                return { answer: directAnswer };
            }
            const queryResult = await this.usePrisma.$queryRawUnsafe(modelResponse);
            const finalAnswer = await this.generateFinalAnswer(prompt, queryResult);
            return { answer: finalAnswer };
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SearchService);
//# sourceMappingURL=search.service.js.map