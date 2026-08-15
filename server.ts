import { buildApp } from "./server/app.js";
import { env } from "./server/config/env.js";
import { logger } from "./server/utils/logger.js";
import { prisma } from "./src/lib/prisma";

async function startServer() {
  try {
    const app = await buildApp();
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown implementation
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed.");
        try {
          await prisma.$disconnect();
          logger.info("Prisma Client disconnected.");
          process.exit(0);
        } catch (err) {
          logger.error("Error during Prisma disconnection", { error: err });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

startServer();
