// serve.js
// Local dev server that runs Vite in middleware mode and mounts your api handler.
// Loads .env automatically (dotenv) and avoids using app.use('*', ...) which can trigger path-to-regexp errors.

import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const app = express();

  // Import your API handler module and adapt it for express (Vercel-style)
  const tiktokModule = await import("./api/tiktok-followers.js");
  const tiktokHandler = tiktokModule.default;

  // mount API route explicitly
  app.get("/api/tiktok-followers", (req, res) => {
    // the handler expects (req, res) like Vercel serverless style; this works.
    return tiktokHandler(req, res);
  });

  // Create vite dev server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Use Vite's middleware (HMR, static transform)
  app.use(vite.middlewares);

  // Catch-all handler: DON'T pass a path string to app.use() to avoid path-to-regexp issues.
  // Serve index.html transformed by Vite for any request that isn't an API route.
  app.use(async (req, res) => {
    try {
      // If request starts with /api, let it 404 (or be handled above)
      if (req.path.startsWith("/api/")) {
        return res.status(404).send("Not found");
      }

      const url = req.originalUrl;
      // Vite will transform index.html and inject HMR client
      let html = await vite.transformIndexHtml(url, await vite.ssrLoadModule("/index.html"));
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  const PORT = process.env.PORT ? Number(process.env.PORT) : 5173;
  app.listen(PORT, () => {
    console.log(` Local dev running: http://localhost:${PORT}`);
    console.log(` API available at: http://localhost:${PORT}/api/tiktok-followers`);
  });
}

start().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
