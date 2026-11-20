import { StyleSheet, Text, View } from 'react-native';

import { BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import { Boton } from './Boton';

type PropsDeLaFilaDelMostrador = {
  titulo: string;
  personaAlFrente: string;
  cantidadEsperando: number;
  alEntregar: () => void;
};

export function FilaDelMostrador({ titulo, personaAlFrente, cantidadEsperando, alEntregar }: PropsDeLaFilaDelMostrador) {
  const estilos = useEstilos(armarEstilos);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.detalle}>Al frente: {personaAlFrente}</Text>
      <Text style={estilos.detalle}>
        {cantidadEsperando === 1 ? 'Espera 1 persona' : `Esperan ${cantidadEsperando} personas`}
      </Text>
      <Boton texto="Entregar al siguiente" icono="hand-right-outline" alTocar={alEntregar} />
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    tarjeta: {
      marginHorizontal: ESPACIO.grande,
      marginTop: ESPACIO.medio,
      padding: ESPACIO.grande,
      gap: ESPACIO.chico,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.grande, fontWeight: PESO_LETRA.fuerte },
    detalle: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.normal },
  });
}
