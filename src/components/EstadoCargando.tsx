import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';

type PropsDeEstadoCargando = { mensaje: string };

export function EstadoCargando({ mensaje }: PropsDeEstadoCargando) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();

  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { padding: ESPACIO.enorme, alignItems: 'center', gap: ESPACIO.medio },
    mensaje: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.normal, textAlign: 'center' },
  });
}
