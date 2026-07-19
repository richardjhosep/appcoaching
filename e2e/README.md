# Suite e2e (Playwright)

Suite de humo por rol contra el stack real (`docker compose`), no contra `frontend`/`backend` en modo dev. Un flujo por rol: login → una acción principal.

- `tests/coach.spec.ts` — login como coach → crea una empresa desde Administración.
- `tests/coachee.spec.ts` — siembra una empresa+coachee vía API, login como ese coachee → registra un logro en Mi progreso.
- `tests/empresa.spec.ts` — siembra una cuenta Empresa vía API, login → responde una encuesta de satisfacción.

Es un paquete npm separado de `frontend`/`backend` a propósito: así una falla de red al instalar Playwright (o su navegador) nunca compromete el `package-lock.json` ni el `npm ci` de los otros dos workspaces, que ya son reproducibles y rápidos en CI.

## Correr localmente

```bash
cp .env.example .env   # o usa tu .env real
docker compose up --build -d
cd e2e
npm install
npx playwright install --with-deps chromium
npm test
docker compose down    # al terminar
```

## CI

El job `e2e` en `.github/workflows/ci.yml` hace exactamente esto: levanta el stack completo, espera `/api/health`, instala Playwright y corre la suite — sube el reporte HTML como artifact solo si falla.
