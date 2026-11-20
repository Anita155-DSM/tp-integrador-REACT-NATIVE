import { StyleSheet, Switch, Text, View } from 'react-native';

import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import { formatearFechaLinda } from '../lib/fechas';
import type { Prestamo } from '../types';
import { Boton } from './Boton';

type PropsDeLaTarjeta = {
  prestamo: Prestamo;
  alCambiarRecordatorio: (quiereRecordatorio: boolean) => void;
  alDevolver: () => void;
};

export function TarjetaDePrestamo({ prestamo, alCambiarRecordatorio, alDevolver }: PropsDeLaTarjeta) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  const tieneRecordatorio = prestamo.idDeLaNotificacion !== null;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{prestamo.titulo}</Text>
      <Text style={estilos.detalle}>Devolvelo el {formatearFechaLinda(prestamo.fechaDeDevolucion)}</Text>
      <View style={estilos.filaDelInterruptor}>
        <Text style={estilos.detalle}>Recordarme</Text>
        <Switch
          value={tieneRecordatorio}
          onValueChange={alCambiarRecordatorio}
          trackColor={{ true: colores.primario, false: colores.borde }}
          accessibilityRole="switch"
          accessibilityLabel={`Recordarme devolver ${prestamo.titulo}`}
          style={estilos.interruptor}
        />
      </View>
      <Boton texto="Devolver" icono="return-down-back" variante="peligro" alTocar={alDevolver} />
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
    filaDelInterruptor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: AREA_TACTIL_MINIMA },
    interruptor: { minHeight: AREA_TACTIL_MINIMA, minWidth: AREA_TACTIL_MINIMA },
  });
}
