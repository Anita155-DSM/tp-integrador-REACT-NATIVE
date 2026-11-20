import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AREA_TACTIL_MINIMA, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import type { Libro } from '../types';

type PropsDeLaFila = { libro: Libro };

// una fila del catálogo o del buscador; al tocarla abre el detalle del libro
export function FilaDeLibro({ libro }: PropsDeLaFila) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${libro.titulo}, de ${libro.autor}`}
      accessibilityHint="Abre la ficha del libro"
      onPress={() => router.navigate({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })}
      style={({ pressed }) => [estilos.fila, pressed && estilos.apretada]}
    >
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>
          {libro.autor} · {libro.anio}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colores.textoSuave} />
    </Pressable>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    fila: {
      minHeight: AREA_TACTIL_MINIMA,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ESPACIO.grande,
      paddingVertical: ESPACIO.medio,
      backgroundColor: colores.superficie,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colores.borde,
    },
    apretada: { opacity: 0.7 },
    textos: { flex: 1, gap: ESPACIO.chiquito },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.normal, fontWeight: PESO_LETRA.fuerte },
    autor: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.chica },
  });
}
