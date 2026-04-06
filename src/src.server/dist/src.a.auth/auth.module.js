"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const jwt_config_1 = require("../src.b.jwt/jwt.config");
const oauth_github_1 = require("./auth.oauth/oauth.github");
const oauth_google_1 = require("./auth.oauth/oauth.google");
const auth_controller_1 = require("./auth.controller");
const users_service_1 = require("../src.a.users/users.service");
const auth_service_1 = require("./auth.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '24h' },
            }),
        ],
        providers: [auth_service_1.AuthService, users_service_1.UsersService, oauth_google_1.GoogleOauth, oauth_github_1.GithubOauth, jwt_config_1.JwtConfig],
        controllers: [auth_controller_1.AuthController],
        exports: [jwt_1.JwtModule, jwt_config_1.JwtConfig],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map