import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    getAiChatHistory(req: any): Promise<{
        messageId: string;
        prompt: string;
        response: string;
        createdAt: Date;
    }[]>;
    handleSearch(body: any, req: any): Promise<{
        answer: any;
    }>;
}
