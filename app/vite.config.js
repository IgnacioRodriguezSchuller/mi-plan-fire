import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Salida objetivo: un único HTML autocontenido (el "lead magnet"),
// que reproduce mi_plan_v1_5_0a_3.html sin scripts CDN ni babel-standalone.
// `vite-plugin-singlefile` inlinea JS y CSS dentro de dist/index.html.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // recharts se pre-empaqueta con su propia copia de React si no se deduplica,
  // lo que provoca "Invalid hook call / more than one copy of React" en dev.
  // Forzar una única instancia de react/react-dom lo resuelve. (Fix estándar
  // de Vite para recharts; no toca ningún componente.)
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Refuerzos para garantizar un solo fichero (el plugin ya fija la mayoría):
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
