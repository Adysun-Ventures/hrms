import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));
const functionsDir = fileURLToPath(new URL('./netlify/functions', import.meta.url));

/**
 * Serves netlify/functions/* on their `config.path` during `vite` dev, so local dev is one
 * command (no netlify-cli). Production runs the same files as Netlify Functions.
 */
function netlifyFunctionsDev(): Plugin {
  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server) {
      // Server code reads secrets from process.env, as it does on Netlify.
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''));
      const files = readdirSync(functionsDir).filter((f) => /\.m?ts$/.test(f) && !f.includes('.test.'));

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        try {
          for (const file of files) {
            const mod = await server.ssrLoadModule(`${functionsDir}/${file}`);
            // '/api/emp-details/:id' -> named groups, as Netlify passes them in context.params.
            const pattern = new RegExp(`^${mod.config.path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}/?$`);
            const match = pattern.exec(url.pathname);
            if (!match) continue;

            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            const request = new Request(url, {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: chunks.length ? Buffer.concat(chunks) : undefined,
            });
            const response: Response = await mod.default(request, { params: { ...match.groups } });
            res.statusCode = response.status;
            response.headers.forEach((v, k) => res.setHeader(k, v));
            res.end(Buffer.from(await response.arrayBuffer()));
            return;
          }
          next();
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), netlifyFunctionsDev()],
  resolve: { alias: { '@': src } },
  server: { port: 3000, host: true }, // host: reachable on the LAN, like next dev was
  build: { assetsDir: 'static', sourcemap: false, chunkSizeWarningLimit: 1500 },
});
