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
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { RateLimitEntry } from "./models/RateLimitEntry.js";

const app = express();
app.disable("x-powered-by");
app.set("query parser", "simple");

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(corsMiddleware());
app.use(helmet({
  frameguard: { action: "deny" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  strictTransportSecurity: config.isProduction ? undefined : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com", "https://api.razorpay.com", "https://vitals.vercel-insights.com"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://api.razorpay.com", "https://*.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://checkout.razorpay.com", "https://va.vercel-scripts.com"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: config.isProduction ? [] : null,
    },
  },
}));
app.use(express.json({
  limit: "1mb",
  verify(req, _res, buffer) {
    if (req.originalUrl.includes("/payments/razorpay/webhook")) {
      req.rawBody = Buffer.from(buffer);
    }
  },
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(apiPrefixRewrite(config.apiPrefix));
app.use("/api", globalLimiter, apiRouter);
app.use("/api", notFound);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        time: new Date()
    });
});

app.use(express.static(config.distDir));

app.get("*", (_req, res, next) => {
  res.sendFile(path.join(config.distDir, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

app.use(errorHandler);

const databaseConnected = await connectDatabase(process.env.MONGODB_URI);
if (config.isProduction && !databaseConnected) {
  throw new Error("Production startup aborted because MongoDB is unavailable.");
}
if (databaseConnected) await RateLimitEntry.init();
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
