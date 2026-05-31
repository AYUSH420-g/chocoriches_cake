import path from "node:path";
import express from "express";
import { config } from "./config/env.js";
import { connectDatabase } from "./db.js";
import { apiPrefixRewrite } from "./middleware/apiPrefix.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { warmProductListCache } from "./controllers/productController.js";
import { apiRouter } from "./routes/apiRoutes.js";
import { seedDatabase } from "./services/seedService.js";

const app = express();

app.use(corsMiddleware());
app.use(express.json({ limit: "8mb" }));
app.use(apiPrefixRewrite(config.apiPrefix));
app.use("/api", apiRouter);
app.use("/api", notFound);

app.use(express.static(config.distDir));

app.get("*", (_req, res, next) => {
  res.sendFile(path.join(config.distDir, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

app.use(errorHandler);

await connectDatabase(process.env.MONGODB_URI);
await seedDatabase();
warmProductListCache().catch((error) => {
  console.warn("Product list cache warmup failed.");
  console.warn(error.message);
});

const preferredPort = Number(config.port) || 3001;

function startServer(port, remainingAttempts = 10) {
  const server = app.listen(port, () => {
    console.info(`ChocoRiches API running on http://localhost:${port}`);
    if (port !== preferredPort) {
      console.info(`Port ${preferredPort} was busy, so the API switched to ${port}.`);
      console.info(`Update frontend VITE_API_URL to http://localhost:${port}/api/v1 when using this fallback.`);
    }
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && remainingAttempts > 0) {
      const nextPort = Number(port) + 1;
      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      if (server.listening) {
        server.close(() => startServer(nextPort, remainingAttempts - 1));
        return;
      }
      startServer(nextPort, remainingAttempts - 1);
      return;
    }

    throw error;
  });
}

startServer(preferredPort);
