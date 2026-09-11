import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class SearchService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    buildSqlPrompt: (prompt: any, userId: any) => string;
    buildAnswerPrompt: (prompt: any, queryResult: any) => string;
    generateSqlQuery: (prompt: any, userId: any) => Promise<any>;
    generateFinalAnswer: (prompt: any, queryResult: any) => Promise<any>;
    processSearch: (prompt: any, userId: any) => Promise<{
        answer: any;
    }>;
}
