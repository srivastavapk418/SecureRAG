const fs = require("fs");

const app = require("./app");
const connectToDatabase = require("./config/db");
const config = require("./config");

async function bootstrap() {
  fs.mkdirSync(config.uploadDir, { recursive: true });

  await connectToDatabase();

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

