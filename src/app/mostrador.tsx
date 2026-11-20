import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Boton } from '../components/Boton';
import { EstadoVacio } from '../components/EstadoVacio';
import { FilaDelMostrador } from '../components/FilaDelMostrador';
import { BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useEstilos } from '../hooks/useEstilos';
import { encontrarLibroPorIsbn } from '../lib/catalogo';

type LibroConGenteEsperando = {
  isbn: string;
  titulo: string;
  personaAlFrente: string;
  cantidadEsperando: number;
};

export default function PantallaDelMostrador() {
  const estilos = useEstilos(armarEstilos);
  const { listasDeEspera, entregarAlSiguiente, cerrarSesion } = useBiblioteca();
  const [ultimoMovimiento, setUltimoMovimiento] = useState<string | null>(null);

  // solo los libros que tienen a alguien en la cola
  const librosConEspera = useMemo<LibroConGenteEsperando[]>(
    () =>
      Object.entries(listasDeEspera)
        .filter(([, cola]) => cola.tamanio > 0)
        .map(([isbn, cola]) => ({
          isbn,
          titulo: encontrarLibroPorIsbn(isbn)?.titulo ?? `Libro ${isbn}`,
          personaAlFrente: cola.verFrente() ?? '',
          cantidadEsperando: cola.tamanio,
        })),
    [listasDeEspera],
  );

  // cerramos la sesión (Stack.Protected borra el mostrador del historial) y volvemos a lo que había debajo.
  // el back evita que expo-router ponga otra copia de las tabs en el lugar del mostrador
  function salirDelMostrador() {
    cerrarSesion();
    if (router.canGoBack()) {
      router.back();
    }
  }

  async function entregar(isbn: string, titulo: string) {
    const resultado = await entregarAlSiguiente(isbn);
    setUltimoMovimiento(
      resultado.tipo === 'entregado'
        ? `Le entregaste "${titulo}" a ${resultado.persona}.`
        : `Nadie está esperando "${titulo}", así que no había a quién entregárselo.`,
    );
  }

  return (
    <FlatList
      style={estilos.lista}
      data={librosConEspera}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => (
        <FilaDelMostrador
          titulo={item.titulo}
          personaAlFrente={item.personaAlFrente}
          cantidadEsperando={item.cantidadEsperando}
          alEntregar={() => entregar(item.isbn, item.titulo)}
        />
      )}
      ListHeaderComponent={
        ultimoMovimiento ? (
          <View style={estilos.movimiento} accessibilityLiveRegion="polite">
            <Text style={estilos.textoMovimiento}>{ultimoMovimiento}</Text>
          </View>
        ) : undefined
      }
      ListEmptyComponent={<EstadoVacio icono="happy-outline" mensaje="Nadie está esperando libros en este momento." />}
      ListFooterComponent={
        <View style={estilos.pie}>
          {/* al cerrar sesión, Stack.Protected saca el mostrador del historial */}
          <Boton texto="Cerrar sesión" icono="log-out-outline" variante="peligro" alTocar={salirDelMostrador} />
        </View>
      }
    />
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    lista: { flex: 1, backgroundColor: colores.fondo },
    movimiento: {
      marginHorizontal: ESPACIO.grande,
      marginTop: ESPACIO.grande,
      padding: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.fondoExito,
    },
    textoMovimiento: { color: colores.exito, fontSize: TAMANIO_LETRA.normal },
    pie: { padding: ESPACIO.grande },
  });
}
