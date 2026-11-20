import { FlatList, StyleSheet, Text } from 'react-native';

import { AccesosRapidos } from '../../../components/AccesosRapidos';
import { EstadoCargando } from '../../../components/EstadoCargando';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { FilaDeLibro } from '../../../components/FilaDeLibro';
import { VistosRecientes } from '../../../components/VistosRecientes';
import { ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../../../constants/tema';
import { useBiblioteca } from '../../../hooks/useBiblioteca';
import { useEstilos } from '../../../hooks/useEstilos';
import { useLibros } from '../../../hooks/useLibros';

export default function PantallaDelCatalogo() {
  const estilos = useEstilos(armarEstilos);
  const { libros, cargando, error, reintentar } = useLibros();
  const { ultimosVistos } = useBiblioteca();

  // la lista vacía puede significar tres cosas distintas: cargando, falló o de verdad no hay libros
  let loQueSeMuestraSinLibros = <EstadoVacio mensaje="Por ahora la biblioteca no tiene libros cargados." />;
  if (cargando) {
    loQueSeMuestraSinLibros = <EstadoCargando mensaje="Trayendo los libros de la biblioteca…" />;
  } else if (error) {
    loQueSeMuestraSinLibros = <EstadoError mensaje={error} textoDelBoton="Reintentar" alTocar={reintentar} />;
  }

  return (
    <FlatList
      style={estilos.lista}
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => <FilaDeLibro libro={item} />}
      ListHeaderComponent={
        <>
          <VistosRecientes libros={ultimosVistos} />
          <AccesosRapidos />
          <Text style={estilos.subtitulo} accessibilityRole="header">
            Todo el catálogo
          </Text>
        </>
      }
      ListEmptyComponent={loQueSeMuestraSinLibros}
    />
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    lista: { flex: 1, backgroundColor: colores.fondo },
    subtitulo: {
      color: colores.texto,
      fontSize: TAMANIO_LETRA.grande,
      fontWeight: PESO_LETRA.negrita,
      paddingHorizontal: ESPACIO.grande,
      paddingTop: ESPACIO.enorme,
      paddingBottom: ESPACIO.chico,
    },
  });
}
