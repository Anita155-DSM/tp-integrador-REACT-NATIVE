import { Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';

type PropsDelEnlace = { texto?: string };

// salida segura desde cualquier pantalla "sin salida": vuelve al catálogo
export function EnlaceAlCatalogo({ texto = 'Ir al catálogo' }: PropsDelEnlace) {
  const estilos = useEstilos(armarEstilos);

  return (
    <Link href="/" asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [estilos.boton, pressed && estilos.apretado]}>
        <Text style={estilos.texto}>{texto}</Text>
      </Pressable>
    </Link>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    boton: {
      minHeight: AREA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIO.grande,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.primario,
    },
    apretado: { opacity: 0.75 },
    texto: { color: colores.textoSobrePrimario, fontSize: TAMANIO_LETRA.normal, fontWeight: PESO_LETRA.fuerte },
  });
}
