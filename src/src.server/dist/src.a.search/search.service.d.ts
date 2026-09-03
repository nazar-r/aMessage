import { PrismaService } from '../src.b.prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class SearchService {
    private readonly usePrisma;
    private readonly configService;
    constructor(usePrisma: PrismaService, configService: ConfigService);
    buildSqlPrompt: (prompt: any, userId: any) => string;
    buildAnswerPrompt: (prompt: any, queryResult: any) => string;
    callGemini: (promptText: any) => Promise<any>;
    generateSqlQuery: (prompt: any, userId: any) => Promise<any>;
    generateFinalAnswer: (prompt: any, queryResult: any) => Promise<any>;
    processSearch: (prompt: any, userId: any) => Promise<{
        answer: any;
    }>;
}
