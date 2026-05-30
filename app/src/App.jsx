// Entry. Por defecto renderiza la APP REAL (App de screens/, que envuelve Shell
// en StateProvider). Con ?gallery en la URL muestra la galería de componentes
// (herramienta de desarrollo permanente).
import { App as MiPlanApp } from './screens/index.jsx'
import Gallery from './gallery/Gallery.jsx'

export default function App() {
  const showGallery = typeof window !== 'undefined' && window.location.search.includes('gallery')
  return showGallery ? <Gallery /> : <MiPlanApp />
}
