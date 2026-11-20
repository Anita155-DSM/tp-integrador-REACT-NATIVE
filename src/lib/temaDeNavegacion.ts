import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import type { PaletaDeColores } from '../constants/tema';

// le pasamos nuestra paleta a los headers y a la barra de tabs, así no hay colores sueltos en los layouts
export function armarTemaDeNavegacion(colores: PaletaDeColores, esModoOscuro: boolean): Theme {
  const temaBase = esModoOscuro ? DarkTheme : DefaultTheme;
  return {
    ...temaBase,
    colors: {
      ...temaBase.colors,
      primary: colores.primario,
      background: colores.fondo,
      card: colores.superficie,
      text: colores.texto,
      border: colores.borde,
      notification: colores.peligro,
    },
  };
}
