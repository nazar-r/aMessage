import { PrismaService } from '../src.b.prisma/prisma.service';
export declare class SearchService {
    private readonly usePrisma;
    constructor(usePrisma: PrismaService);
    private readonly dbSchema;
    private readonly geminiUrl;
    private readonly slopPrefix;
    private stringifyResult;
    private callGemini;
    private firstRequest;
    private finalRequest;
    private retryRequest;
    private buildDBQuery;
    private buildClientAnswer;
    readonly getChatHistory: (userId: any) => Promise<{
        chatHistory: unknown;
    }>;
    readonly useGemini: (prompt: any, userId: any) => Promise<{
        answer: any;
    }>;
}
