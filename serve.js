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

  
  const tiktokModule = await import("./api/tiktok-followers.js");
  const tiktokHandler = tiktokModule.default;

  
  app.get("/api/tiktok-followers", (req, res) => {
    return tiktokHandler(req, res);
  });

  
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  
  app.use(vite.middlewares);


  app.use(async (req, res) => {
    try {
      if (req.path.startsWith("/api/")) {
        return res.status(404).send("Not found");
      }

      const url = req.originalUrl;
      //vite will transform index.html and inject HMR client
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
