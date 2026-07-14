const path = require('path');

module.exports = {
  apps: [
    {
      name: "amessage-server",
      script: path.resolve(__dirname, "../dist/main.js"),
      cwd: path.resolve(__dirname, ".."),
      instances: "8",
      exec_mode: "cluster",
    },
  ],
};