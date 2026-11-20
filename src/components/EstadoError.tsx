import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import { Boton } from './Boton';

type PropsDeEstadoError = {
  mensaje: string;
  textoDelBoton: string;
  alTocar: () => void;
};

// todo error trae una salida: nunca dejamos a la persona sin saber qué hacer
export function EstadoError({ mensaje, textoDelBoton, alTocar }: PropsDeEstadoError) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();

  return (
    <View style={estilos.contenedor} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={36} color={colores.peligro} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <Boton texto={textoDelBoton} alTocar={alTocar} icono="refresh" />
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: {
      margin: ESPACIO.grande,
      padding: ESPACIO.enorme,
      alignItems: 'center',
      gap: ESPACIO.medio,
      backgroundColor: colores.fondoPeligro,
      borderRadius: BORDE_REDONDEADO,
    },
    mensaje: { color: colores.texto, fontSize: TAMANIO_LETRA.normal, textAlign: 'center' },
  });
}
