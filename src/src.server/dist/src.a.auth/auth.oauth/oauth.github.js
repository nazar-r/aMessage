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
exports.GithubOauth = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_github2_1 = require("passport-github2");
const users_service_1 = require("../../src.a.users/users.service");
let GithubOauth = class GithubOauth extends (0, passport_1.PassportStrategy)(passport_github2_1.Strategy, 'github') {
    constructor(usersService) {
        super({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            scope: ['user:email'],
        });
        this.usersService = usersService;
    }
    async validate(accessToken, refreshToken, profile) {
        const githubId = profile?.id;
        const email = profile?.emails?.[0]?.value ||
            profile?._json?.email ||
            null;
        const name = profile?.displayName ||
            profile?.username ||
            profile?._json?.name ||
            profile?._json?.login ||
            email?.split('@')[0] ||
            'Unknown';
        if (!githubId) {
            throw new common_1.UnauthorizedException('Github profile ID is missing');
        }
        if (!email) {
            throw new common_1.UnauthorizedException('Email is missing in Github profile');
        }
        return this.usersService.findOrCreateUser({
            userId: `gt_${githubId}`,
            email,
            name,
        });
    }
};
exports.GithubOauth = GithubOauth;
exports.GithubOauth = GithubOauth = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], GithubOauth);
//# sourceMappingURL=oauth.github.js.map