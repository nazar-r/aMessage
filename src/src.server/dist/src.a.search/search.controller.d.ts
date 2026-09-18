import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    getAiChatHistory(req: any): Promise<{
        chatHistory: unknown;
    }>;
    handleSearch(body: any, req: any): Promise<{
        answer: any;
    }>;
}
