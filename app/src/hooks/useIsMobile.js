// Hook genérico — extraído byte-a-byte de mi_plan_v1_5_0a_3.html (L1964).
// Etapa 1 · Paso 3 · Tanda 3. Sin dependencia de state; destinado a hooks/
// por la decisión #1. Necesario por Card (ui/).
import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [mobile, setMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}
