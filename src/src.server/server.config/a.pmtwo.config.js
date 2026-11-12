const path = require('path');

module.exports = {
  apps: [
    {
      name: "amessage-server",
      script: path.resolve(__dirname, "../dist/main.js"),
      cwd: path.resolve(__dirname, ".."),
      instances: "6",
      exec_mode: "cluster",
      node_args: '--initial-old-space-size=128 --max-old-space-size=256',
    },
  ],
};