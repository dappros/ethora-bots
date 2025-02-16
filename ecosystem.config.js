// This is the ecosystem config useful for launching multiple bots at once
// from one service instance, managed by pm2.

module.exports = {
  apps: [
    {
      name: "openai-bot",
      cwd: "./bots/openai-bot",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "development"
      },
      watch: ["dist"],
      ignore_watch: ["node_modules"]
    },
    {
      name: "prisoner-bot",
      cwd: "./bots/prisoner-bot",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "development"
      },
      watch: ["dist"],
      ignore_watch: ["node_modules"]
    }
  ]
}
