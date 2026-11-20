import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  AREA_TACTIL_MINIMA,
  BORDE_REDONDEADO,
  ESPACIO,
  PESO_LETRA,
  TAMANIO_ICONO,
  TAMANIO_LETRA,
  type PaletaDeColores,
} from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';

type VarianteDelBoton = 'primario' | 'secundario' | 'peligro';

type PropsDelBoton = {
  texto: string;
  alTocar: () => void;
  variante?: VarianteDelBoton;
  icono?: ComponentProps<typeof Ionicons>['name'];
  deshabilitado?: boolean;
  pistaAccesible?: string;
};

// botón de texto (con ícono opcional) que usamos en toda la app
export function Boton({ texto, alTocar, variante = 'primario', icono, deshabilitado = false, pistaAccesible }: PropsDelBoton) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  const colorDelTextoSegunVariante = {
    primario: colores.textoSobrePrimario,
    secundario: colores.primario,
    peligro: colores.peligro,
  };
  const estiloDelTextoSegunVariante = {
    primario: estilos.textoPrimario,
    secundario: estilos.textoSecundario,
    peligro: estilos.textoPeligro,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      accessibilityHint={pistaAccesible}
      disabled={deshabilitado}
      onPress={alTocar}
      style={({ pressed }) => [
        estilos.base,
        estilos[variante],
        pressed && estilos.apretado,
        deshabilitado && estilos.deshabilitado,
      ]}
    >
      {icono ? <Ionicons name={icono} size={TAMANIO_ICONO} color={colorDelTextoSegunVariante[variante]} /> : null}
      <Text style={[estilos.texto, estiloDelTextoSegunVariante[variante]]}>{texto}</Text>
    </Pressable>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    base: {
      minHeight: AREA_TACTIL_MINIMA,
      minWidth: AREA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIO.grande,
      paddingVertical: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.chico,
    },
    primario: { backgroundColor: colores.primario },
    secundario: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.primario },
    peligro: { backgroundColor: colores.fondoPeligro, borderWidth: 1, borderColor: colores.peligro },
    apretado: { opacity: 0.75 },
    deshabilitado: { opacity: 0.45 },
    texto: { fontSize: TAMANIO_LETRA.normal, fontWeight: PESO_LETRA.fuerte },
    textoPrimario: { color: colores.textoSobrePrimario },
    textoSecundario: { color: colores.primario },
    textoPeligro: { color: colores.peligro },
  });
}
