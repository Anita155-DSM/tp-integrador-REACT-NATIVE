import { StyleSheet, Text, View } from 'react-native';

import { BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import type { AvisoEnLaApp } from '../types';
import { BotonSoloIcono } from './BotonSoloIcono';

type PropsDeLaListaDeAvisos = {
  avisos: AvisoEnLaApp[];
  alDescartar: (id: string) => void;
};

// los avisos "de adentro de la app": funcionan aunque las notificaciones estén denegadas
export function ListaDeAvisos({ avisos, alDescartar }: PropsDeLaListaDeAvisos) {
  const estilos = useEstilos(armarEstilos);

  if (avisos.length === 0) {
    return null;
  }

  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      {avisos.map((aviso) => (
        <View key={aviso.id} style={estilos.aviso}>
          <Text style={estilos.texto}>{aviso.texto}</Text>
          <BotonSoloIcono icono="close" etiquetaAccesible="Descartar aviso" alTocar={() => alDescartar(aviso.id)} />
        </View>
      ))}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { gap: ESPACIO.chico, paddingHorizontal: ESPACIO.grande, paddingTop: ESPACIO.grande },
    aviso: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.fondoAviso,
    },
    texto: { flex: 1, color: colores.aviso, fontSize: TAMANIO_LETRA.chica },
  });
}
