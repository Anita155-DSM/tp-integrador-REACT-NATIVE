import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { EstadoCargando } from '../components/EstadoCargando';
import { EstadoError } from '../components/EstadoError';
import { EstadoVacio } from '../components/EstadoVacio';
import { FilaDeLibro } from '../components/FilaDeLibro';
import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useBusqueda } from '../hooks/useBusqueda';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import { leerParametroDeTexto } from '../lib/catalogo';

export default function PantallaDelBuscador() {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  // la búsqueda vive en la url (/buscar?q=...): si compartís el link, el otro ve lo mismo
  const { q } = useLocalSearchParams<{ q?: string }>();
  const textoDeLaUrl = leerParametroDeTexto(q);
  const { resultados, buscando, error } = useBusqueda(textoDeLaUrl);

  // setParams cambia la url sin apilar pantallas nuevas: "atrás" no recorre letra por letra
  function cambiarTexto(textoNuevo: string) {
    router.setParams({ q: textoNuevo });
  }

  let loQueSeMuestraSinResultados = <EstadoVacio icono="search" mensaje="Escribí un título o un autor para empezar." />;
  if (textoDeLaUrl.trim() !== '') {
    if (buscando) {
      loQueSeMuestraSinResultados = <EstadoCargando mensaje="Buscando en el catálogo…" />;
    } else if (error) {
      loQueSeMuestraSinResultados = <EstadoError mensaje={error} textoDelBoton="Borrar y empezar de nuevo" alTocar={() => cambiarTexto('')} />;
    } else {
      loQueSeMuestraSinResultados = (
        <EstadoVacio icono="sad-outline" mensaje={`No encontramos nada para "${textoDeLaUrl.trim()}". Probá con otra palabra.`} />
      );
    }
  }

  return (
    <View style={estilos.pantalla}>
      <TextInput
        value={textoDeLaUrl}
        onChangeText={cambiarTexto}
        placeholder="Título o autor, por ejemplo: borges"
        placeholderTextColor={colores.textoSuave}
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar por título o autor"
        style={estilos.campo}
      />
      <FlatList
        data={resultados}
        keyExtractor={(libro) => libro.isbn}
        renderItem={({ item }) => <FilaDeLibro libro={item} />}
        ListEmptyComponent={loQueSeMuestraSinResultados}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    campo: {
      minHeight: AREA_TACTIL_MINIMA,
      margin: ESPACIO.grande,
      paddingHorizontal: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.superficie,
      color: colores.texto,
      fontSize: TAMANIO_LETRA.grande,
    },
  });
}
