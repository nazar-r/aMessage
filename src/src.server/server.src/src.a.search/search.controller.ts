import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';

@Controller('search')
@UseGuards(JwtCheck)
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get()
  async getAiChatHistory(@Req() req) {
    const userId = req.user.sub;

    return this.searchService.getAiChatHistory(userId);
  }

  @Post()
  async handleSearch(@Body() body, @Req() req) {
    const userId = req.user.sub;
    const prompt = body.prompt;

    return this.searchService.processSearch(prompt, userId);
  }
}