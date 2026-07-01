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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const users_service_1 = require("../../src.a.users/users.service");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    constructor(usersService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: ['email', 'profile'],
            passReqToCallback: false,
        });
        this.usersService = usersService;
    }
    async validate(accessToken, refreshToken, profile) {
        const googleId = profile?.id;
        const googleEmail = profile?.emails?.[0]?.value;
        const googleName = profile?.displayName
            ?? [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(' ')
            ?? googleEmail?.split('@')[0]
            ?? 'Unknown User';
        if (!googleId) {
            throw new common_1.UnauthorizedException('Google profile ID is missing');
        }
        return this.usersService.findOrCreateUser({
            userId: `ggl_${googleId}`,
            userEmail: googleEmail,
            userName: googleName,
        });
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], GoogleStrategy);
//# sourceMappingURL=oauth.google.js.map