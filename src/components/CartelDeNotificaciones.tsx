import { StyleSheet, Text, View } from 'react-native';

import { BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import type { EstadoDelPermiso } from '../types';

type PropsDelCartel = { estado: EstadoDelPermiso };

const TEXTO_SEGUN_ESTADO: Record<EstadoDelPermiso, string> = {
  cargando: 'Revisando si podemos mandarte notificaciones…',
  concedido: 'Notificaciones activadas: te avisamos aunque tengas la app cerrada.',
  preguntable: 'Todavía no activaste las notificaciones. Te las pedimos cuando prendas "Recordarme".',
  bloqueado: 'Las notificaciones están bloqueadas. No pasa nada: los avisos te aparecen acá adentro.',
};

// muestra el estado actual del permiso; se refresca al volver de ajustes y al volver a la pestaña
export function CartelDeNotificaciones({ estado }: PropsDelCartel) {
  const estilos = useEstilos(armarEstilos);

  return (
    <View style={[estilos.cartel, estado === 'concedido' ? estilos.cartelBueno : estilos.cartelNeutro]}>
      <Text style={estilos.texto}>{TEXTO_SEGUN_ESTADO[estado]}</Text>
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    cartel: { marginHorizontal: ESPACIO.grande, marginTop: ESPACIO.grande, padding: ESPACIO.medio, borderRadius: BORDE_REDONDEADO },
    cartelBueno: { backgroundColor: colores.fondoExito },
    cartelNeutro: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.borde },
    texto: { color: colores.texto, fontSize: TAMANIO_LETRA.chica },
  });
}
