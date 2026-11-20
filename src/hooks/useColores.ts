import { useColorScheme } from 'react-native';

import { COLORES, type PaletaDeColores } from '../constants/tema';

// modo oscuro: elegimos la paleta según lo que tenga configurado el teléfono
export function useColores(): PaletaDeColores {
  const esquemaDelTelefono = useColorScheme();
  return esquemaDelTelefono === 'dark' ? COLORES.oscuro : COLORES.claro;
}
