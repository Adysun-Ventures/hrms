# Adysun HRMS

React 19 + Vite + React Router + Tailwind 4 + Firebase. Server routes are Netlify Functions.

## Run

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:3000 — app + /api functions, one command
npm test           # unit tests (Vitest)
npm run build      # -> dist/
npm run preview    # serve dist/ (no /api)
npm run deploy     # build + netlify deploy --prod
```

`.env.local` needs `FIREBASE_SERVICE_ACCOUNT` (service-account JSON on one line) for the `/api` functions,
and `OPENAI_API_KEY` for "Create with AI". Set the same variables on Netlify.

> Local dev uses the **live** Firestore project (`adysun-hrms`): anything you click is real.

## Layout

| Path | What |
|---|---|
| `src/app/**/page.tsx` | One route per folder (`[id]` → `:id`), lazy-loaded by `src/main.tsx` |
| `src/components/auth/SessionGate.tsx` | Signed-out users on protected paths → `/login` |
| `src/lib/navigation.ts`, `src/lib/link.tsx` | `useRouter` / `usePathname` / `useSearchParams` / `<Link href>` on React Router |
| `netlify/functions/*.ts` | `/api/*` endpoints (login, password, lookup, emp-details, parse-employee) |
| `netlify/lib/` | Server-only code (firebase-admin, scrypt passwords, OpenAI) |
