module.exports = {
  apps : [{
    name: "webhooks-server",
    script: "./server.js",
    watch: true,
    ignore_watch : ["logs"],
    env: {
      NODE_ENV: "dev",
    },
    env_production: {
      NODE_ENV: "prod",
    }
  }]
};
