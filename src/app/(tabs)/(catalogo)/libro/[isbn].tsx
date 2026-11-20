import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Boton } from '../../../../components/Boton';
import { EnlaceAlCatalogo } from '../../../../components/EnlaceAlCatalogo';
import { EstadoVacio } from '../../../../components/EstadoVacio';
import { BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../../../../constants/tema';
import { useBiblioteca } from '../../../../hooks/useBiblioteca';
import { useEstilos } from '../../../../hooks/useEstilos';
import { encontrarLibroPorIsbn, esIsbnValido, leerParametroDeTexto } from '../../../../lib/catalogo';

export default function PantallaDetalleDelLibro() {
  const estilos = useEstilos(armarEstilos);
  const { isbn: isbnDeLaUrl } = useLocalSearchParams<{ isbn: string }>();
  const isbn = leerParametroDeTexto(isbnDeLaUrl);
  const tieneFormatoDeIsbn = esIsbnValido(isbn);
  const libro = tieneFormatoDeIsbn ? encontrarLibroPorIsbn(isbn) : undefined;
  const { anotarComoVisto, ejemplaresDisponibles, cuantosEsperan, yaLoReserve } = useBiblioteca();

  // pila de "vistos recientemente": cada vez que se abre un detalle válido, lo apilamos
  useEffect(() => {
    if (libro) {
      anotarComoVisto(libro);
    }
  }, [libro, anotarComoVisto]);

  if (!libro) {
    const explicacion = tieneFormatoDeIsbn
      ? `No encontramos ningún libro con el ISBN ${isbn} en la biblioteca.`
      : `"${isbn}" no parece un ISBN: tiene que tener 13 números, sin guiones.`;
    return (
      <View style={estilos.pantalla}>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <EstadoVacio icono="help-circle-outline" mensaje={explicacion}>
          <EnlaceAlCatalogo texto="Volver al catálogo" />
        </EstadoVacio>
      </View>
    );
  }

  const disponibles = ejemplaresDisponibles(libro);
  const personasEsperando = cuantosEsperan(libro.isbn);
  const yaEsMio = yaLoReserve(libro.isbn);

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: libro.titulo }} />
      <Text style={estilos.titulo} accessibilityRole="header">
        {libro.titulo}
      </Text>
      <Text style={estilos.autor}>{libro.autor}</Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.dato}>Año: {libro.anio}</Text>
        <Text style={estilos.dato}>ISBN: {libro.isbn}</Text>
        <Text style={[estilos.dato, disponibles > 0 ? estilos.hay : estilos.noHay]}>
          {disponibles > 0 ? `Ejemplares disponibles: ${disponibles}` : 'No quedan ejemplares en el estante'}
        </Text>
        <Text style={estilos.dato}>
          {personasEsperando === 0 ? 'Nadie en lista de espera' : `En lista de espera: ${personasEsperando}`}
        </Text>
      </View>

      {yaEsMio ? (
        <>
          <Text style={estilos.yaReservado}>Ya reservaste este libro.</Text>
          <Boton texto="Ver mis reservas" variante="secundario" alTocar={() => router.navigate('/reservas')} />
        </>
      ) : (
        <Boton
          texto="Reservar"
          icono="bookmark-outline"
          alTocar={() => router.push({ pathname: '/reservar/[isbn]', params: { isbn: libro.isbn } })}
        />
      )}
    </ScrollView>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: ESPACIO.grande, gap: ESPACIO.medio },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.titulo, fontWeight: PESO_LETRA.negrita },
    autor: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.grande },
    tarjeta: {
      padding: ESPACIO.grande,
      gap: ESPACIO.chico,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    dato: { color: colores.texto, fontSize: TAMANIO_LETRA.normal },
    hay: { color: colores.exito, fontWeight: PESO_LETRA.fuerte },
    noHay: { color: colores.aviso, fontWeight: PESO_LETRA.fuerte },
    yaReservado: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.normal, textAlign: 'center' },
  });
}
