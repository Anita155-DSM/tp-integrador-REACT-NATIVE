import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';

type PropsDeEstadoVacio = {
  mensaje: string;
  icono?: ComponentProps<typeof Ionicons>['name'];
  // acá va la acción para salir del estado (un botón, un link…)
  children?: ReactNode;
};

export function EstadoVacio({ mensaje, icono = 'file-tray-outline', children }: PropsDeEstadoVacio) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();

  return (
    <View style={estilos.contenedor}>
      <Ionicons name={icono} size={36} color={colores.textoSuave} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {children}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { padding: ESPACIO.enorme, alignItems: 'center', gap: ESPACIO.medio },
    mensaje: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.normal, textAlign: 'center' },
  });
}
