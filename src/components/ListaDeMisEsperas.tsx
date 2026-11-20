import { StyleSheet, Text, View } from 'react-native';

import { BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import type { ReservaEnEspera } from '../types';

type PropsDeMisEsperas = { reservas: ReservaEnEspera[] };

export function ListaDeMisEsperas({ reservas }: PropsDeMisEsperas) {
  const estilos = useEstilos(armarEstilos);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo} accessibilityRole="header">
        En lista de espera
      </Text>
      {reservas.length === 0 ? (
        <Text style={estilos.vacio}>No estás esperando ningún libro.</Text>
      ) : (
        reservas.map((reserva) => (
          <View key={reserva.isbn} style={estilos.fila}>
            <Text style={estilos.tituloDelLibro}>{reserva.titulo}</Text>
            <Text style={estilos.posicion}>
              {reserva.posicion === 1 ? 'Sos la próxima persona' : `Puesto ${reserva.posicion}`}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { padding: ESPACIO.grande, gap: ESPACIO.chico },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.grande, fontWeight: PESO_LETRA.negrita },
    vacio: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.chica },
    fila: {
      padding: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIO.chiquito,
    },
    tituloDelLibro: { color: colores.texto, fontSize: TAMANIO_LETRA.normal, fontWeight: PESO_LETRA.fuerte },
    posicion: { color: colores.primario, fontSize: TAMANIO_LETRA.chica },
  });
}
