const fs = require("fs");

const app = require("./app");
const connectToDatabase = require("./config/db");
const config = require("./config");

async function bootstrap() {
  fs.mkdirSync(config.uploadDir, { recursive: true });

  await connectToDatabase();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${config.port} (0.0.0.0)`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

