# Mi Plan FIRE — build (Vite, single-file)

Andamiaje de build de la **Etapa 1 · Paso 2**. Reemplaza el monolito
`mi_plan_v1_5_0a_3.html` (React + Babel-standalone vía CDN) por un proyecto
Vite que transpila en disco y emite **un único HTML autocontenido**.

> Este subdirectorio `app/` es el root de Vite, aislado del histórico de
> `mi_plan_*.html` que vive en la raíz del repo. En este paso solo está el
> esqueleto + un placeholder; los componentes reales se migran en el Paso 3.

## Requisitos
- Node **22 LTS** (ver `.nvmrc`). Con nvm: `nvm use` dentro de `app/`.

## Comandos

```bash
cd app
npm install        # instala dependencias (versiones fijadas en package.json)
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # genera el lead magnet single-file en dist/index.html
npm run preview    # sirve la build de dist/ para comprobarla
```

**El lead magnet se genera con `npm run build`** → produce `dist/index.html`,
un único fichero con JS y CSS inline (sin scripts CDN ni babel-standalone).
`dist/` y `node_modules/` están en el `.gitignore` del repo.

## Versiones (contrato del baseline)
Runtime fijado exacto, igual que `docs/etapa1-baseline.md` §4:

| Dependencia | Versión |
|---|---|
| react | 18.2.0 |
| react-dom | 18.2.0 |
| recharts | 2.10.3 |
| prop-types | 15.8.1 |

Tooling de build (no fijado por el baseline): Vite 6 + `@vitejs/plugin-react` +
`vite-plugin-singlefile`. Versiones exactas resueltas en `package.json` /
`package-lock.json`.

## Estructura `src/` (según baseline)
Carpetas vacías (con `.gitkeep`) listas para recibir los símbolos en el Paso 3:

```
src/
  tokens/  content/  state/  lib/  hooks/
  ui/      charts/   modals/ screens/ flows/
  main.jsx   # punto de entrada
  App.jsx    # placeholder "Hola" (no es componente real migrado)
```
