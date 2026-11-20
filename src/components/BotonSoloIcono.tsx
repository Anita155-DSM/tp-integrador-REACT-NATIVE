import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AREA_TACTIL_MINIMA, TAMANIO_ICONO } from '../constants/tema';
import { useColores } from '../hooks/useColores';

type PropsDelBotonSoloIcono = {
  icono: ComponentProps<typeof Ionicons>['name'];
  // obligatoria: sin texto visible, el lector de pantalla necesita saber qué hace
  etiquetaAccesible: string;
  alTocar: () => void;
};

export function BotonSoloIcono({ icono, etiquetaAccesible, alTocar }: PropsDelBotonSoloIcono) {
  const colores = useColores();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible}
      onPress={alTocar}
      style={({ pressed }) => [estilos.boton, pressed && estilos.apretado]}
    >
      <Ionicons name={icono} size={TAMANIO_ICONO} color={colores.textoSuave} />
    </Pressable>
  );
}

// este no depende de la paleta, así que alcanza con armarlo una sola vez
const estilos = StyleSheet.create({
  boton: {
    width: AREA_TACTIL_MINIMA,
    height: AREA_TACTIL_MINIMA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apretado: { opacity: 0.6 },
});
