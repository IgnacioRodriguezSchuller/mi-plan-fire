# Mi Plan FIRE — app (Vite, single-file)

Codebase de la app: módulos ES en `app/src/` que **Vite** compila a un **único HTML autocontenido** (`dist/index.html`), sin scripts CDN ni Babel-in-browser. Reemplazó al monolito `mi_plan_v1_5_0a_3.html`, que queda **congelado en la raíz del repo** como red de regresión.

> `app/src` nació funcionalmente idéntico al baseline (migración byte-a-byte, Etapa 1) y **diverge a propósito** desde entonces con sprints de producto/diseño. El estado actual y los pendientes viven en `ESTADO.md` (raíz); las reglas de trabajo, en `CLAUDE.md` (raíz).

## Requisitos
- Node **22 LTS** (`.nvmrc`). Con nvm: `nvm use` dentro de `app/`.

## Comandos
```bash
cd app
npm install        # deps con versiones fijadas (package.json)
npm run dev        # desarrollo · http://localhost:5173
npm run build      # genera el lead magnet single-file · dist/index.html
npm run preview    # sirve la build de dist/
```
- `http://localhost:5173/?gallery` → **galería de componentes** (cada primitiva/gráfico/modal con datos de ejemplo).
- Verificadores deterministas: `node scripts/verify-tokens.mjs` (y `verify-lib`, `verify-content`, `verify-state`).
- `dist/` y `node_modules/` están en `.gitignore`.

## Versiones del runtime (contrato del baseline)
| Dependencia | Versión |
|---|---|
| react | 18.2.0 |
| react-dom | 18.2.0 |
| recharts | 2.10.3 |
| prop-types | 15.8.1 |

Tooling de build: Vite 6 + `@vitejs/plugin-react` + `vite-plugin-singlefile`.

## Estructura `src/`
Símbolos agrupados por capa (de hojas a raíz):

```
src/
  tokens/    # T, WEB_URL
  lib/       # funciones puras: projectV2, runMonteCarlo, estimateSpanishPension, …
  hooks/     # hooks compartidos (useIsMobile)
  content/   # TABLON, corpus editorial (LEARN_CORPUS / LEARN_LEVELS)
  ui/        # primitivas
  charts/    # gráficos (Recharts)
  modals/    # ConfirmModal, AboutModal, …
  flows/     # landings / onboarding
  screens/   # ScreenHoy, ScreenProyeccion, … + Shell + App
  state/     # StateProvider, load/save, migrateToV2 (se carga el último)
  gallery/   # galería de componentes (dev · render con ?gallery)
  App.jsx    # entrada: app real o galería de componentes según ?gallery
  main.jsx   # punto de entrada (monta App.jsx)
  index.css  # reset / estilos globales
```
