"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
const node_path_1 = require("node:path");
exports.default = (0, config_1.defineConfig)({
    schema: node_path_1.default.join("server.src", "src.b.database", "schema.prisma"),
    migrations: {
        path: node_path_1.default.join("server.src", "src.b.database", "migrations"),
    },
    datasource: {
        url: (0, config_1.env)("DIRECT_URL") || (0, config_1.env)("DATABASE_URL"),
    },
});
//# sourceMappingURL=prisma.config.js.map