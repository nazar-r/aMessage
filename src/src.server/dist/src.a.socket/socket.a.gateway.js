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
exports.SocketGateway = void 0;
const socket_b_service_1 = require("./socket.b.service");
const socket_io_1 = require("socket.io");
const websockets_1 = require("@nestjs/websockets");
let SocketGateway = class SocketGateway {
    constructor(SocketService) {
        this.SocketService = SocketService;
    }
    async afterInit() {
        await this.SocketService.afterInit(this.server);
    }
    async handleConnection(client) {
        const onlineUsers = await this.SocketService.handleConnection(client);
        if (!onlineUsers)
            return;
        this.server.emit('usersOnline', onlineUsers);
    }
    async handleDisconnect(client) {
        const onlineUsers = await this.SocketService.handleDisconnect(client);
        if (!onlineUsers)
            return;
        this.server.emit('usersOnline', onlineUsers);
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { credentials: true },
    }),
    __metadata("design:paramtypes", [socket_b_service_1.SocketService])
], SocketGateway);
//# sourceMappingURL=socket.a.gateway.js.map