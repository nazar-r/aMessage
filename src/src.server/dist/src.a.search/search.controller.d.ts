import { SearchService } from './search.service';
import type { TBody, TReq } from '../src.c.extensions/extensions.types/types.auth';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    getAiChatHistory(req: TReq): Promise<{
        chatHistory: unknown;
    }>;
    handleSearch(req: TReq, body: TBody): Promise<{
        answer: any;
    }>;
}
