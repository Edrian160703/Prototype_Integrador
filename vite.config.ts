import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleGeminiRequest } from "./server/gemini/handler";

function geminiApiPlugin(): Plugin {
  return {
    name: "gemini-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use("/api/gemini", async (req, res) => {
        await handleGeminiMiddleware(req, res, env);
      });
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use("/api/gemini", async (req, res) => {
        await handleGeminiMiddleware(req, res, env);
      });
    },
  };
}

async function handleGeminiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
): Promise<void> {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(name, value);
      else if (Array.isArray(value)) headers.set(name, value.join(", "));
    }

    const request = new Request(`http://localhost${req.url ?? "/api/gemini"}`, {
      method: req.method,
      headers,
      body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
    });
    const response = await handleGeminiRequest(request, { env });

    res.statusCode = response.status;
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.end(await response.text());
  } catch (error) {
    console.error("Error en el endpoint local /api/gemini:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: {
        code: "UNKNOWN",
        message: "No pudimos completar el análisis.",
      },
    }));
  }
}

export default defineConfig({
  plugins: [react(), geminiApiPlugin()],
  test: {
    environment: "jsdom",
    restoreMocks: true,
    exclude: [...configDefaults.exclude, "firestore-tests/**"],
  },
});
