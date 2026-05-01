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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../src.a.users/users.service");
let AuthService = class AuthService {
    constructor(jwtService, usersService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.googleLogin = async (profile) => {
            const user = await this.usersService.findOrCreateUser(profile);
            const loginUser = () => ({
                access_token: this.jwtService.sign({
                    userId: user.userId,
                    name: user.userName,
                    email: user.email,
                }),
            });
            return loginUser();
        };
        this.githubLogin = async (profile) => {
            const user = await this.usersService.findOrCreateUser(profile);
            const loginUser = () => ({
                access_token: this.jwtService.sign({
                    userId: user.userId,
                    name: user.userName,
                    email: user.email ?? undefined,
                }),
            });
            return loginUser();
        };
        this.generateTokens = async (profile) => {
            const payload = {
                userId: profile.userId,
                name: profile.name,
                email: profile.email
            };
            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync(payload, { expiresIn: '1d' }),
                this.jwtService.signAsync(payload, { expiresIn: '7d' })
            ]);
            console.log("ACCESS TOKEN:", accessToken);
            console.log("REFRESH TOKEN:", refreshToken);
            return { accessToken, refreshToken };
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map