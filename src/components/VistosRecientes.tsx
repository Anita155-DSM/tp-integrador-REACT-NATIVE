import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import type { Libro } from '../types';

type PropsDeVistosRecientes = { libros: Libro[] };

// los 3 del tope de la pila, del más reciente al más viejo
export function VistosRecientes({ libros }: PropsDeVistosRecientes) {
  const estilos = useEstilos(armarEstilos);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo} accessibilityRole="header">
        Vistos recientemente
      </Text>
      {libros.length === 0 ? (
        <Text style={estilos.vacio}>Todavía no abriste ningún libro. Cuando mires uno, aparece acá.</Text>
      ) : (
        <View style={estilos.fila}>
          {libros.map((libro) => (
            <Link key={libro.isbn} href={{ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } }} asChild>
              <Pressable accessibilityRole="button" style={({ pressed }) => [estilos.tarjeta, pressed && estilos.apretada]}>
                <Text style={estilos.tituloDelLibro} numberOfLines={2}>
                  {libro.titulo}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { paddingHorizontal: ESPACIO.grande, paddingTop: ESPACIO.grande, gap: ESPACIO.chico },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.grande, fontWeight: PESO_LETRA.negrita },
    vacio: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.chica },
    fila: { flexDirection: 'row', gap: ESPACIO.chico },
    tarjeta: {
      flex: 1,
      minHeight: AREA_TACTIL_MINIMA * 1.5,
      padding: ESPACIO.medio,
      justifyContent: 'center',
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    apretada: { opacity: 0.7 },
    tituloDelLibro: { color: colores.primario, fontSize: TAMANIO_LETRA.chica, fontWeight: PESO_LETRA.fuerte },
  });
}
