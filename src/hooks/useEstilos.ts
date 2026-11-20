import { useMemo } from 'react';

import type { PaletaDeColores } from '../constants/tema';
import { useColores } from './useColores';

// cada archivo arma sus estilos con StyleSheet.create a partir de la paleta;
// este hook los recalcula solo cuando cambia el modo claro/oscuro
export function useEstilos<T>(armarEstilos: (colores: PaletaDeColores) => T): T {
  const colores = useColores();
  return useMemo(() => armarEstilos(colores), [armarEstilos, colores]);
}
