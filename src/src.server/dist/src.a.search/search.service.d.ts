import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class SearchService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    dbSchema: string;
    geminiUrl: string;
    slopPrefix: string;
    stringifyResult: (data: any) => string;
    callGemini: (promptText: any) => Promise<any>;
    firstRequest: (prompt: any, userId: any) => string;
    finalRequest: (prompt: any, queryResult: any) => string;
    retryRequest: (sql: any, error: any) => string;
    buildDBQuery: (prompt: any, userId: any) => Promise<any>;
    buildClientAnswer: (prompt: any, queryResult: any) => Promise<any>;
    getChatHistory: (userId: any) => Promise<{
        chatHistory: unknown;
    }>;
    useGemini: (prompt: any, userId: any) => Promise<{
        answer: any;
    }>;
}
