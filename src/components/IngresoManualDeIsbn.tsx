import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { LARGO_DEL_ISBN } from '../constants/biblioteca';
import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import { esIsbnValido } from '../lib/catalogo';
import { Boton } from './Boton';

type PropsDelIngresoManual = { alConfirmar: (isbn: string) => void };

// el plan b de siempre: si no hay cámara (o no querés usarla), escribís el isbn
export function IngresoManualDeIsbn({ alConfirmar }: PropsDelIngresoManual) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  const [isbnEscrito, setIsbnEscrito] = useState('');
  const [problemaDelIsbn, setProblemaDelIsbn] = useState<string | null>(null);

  function confirmarIsbn() {
    const soloNumeros = isbnEscrito.replace(/[^0-9]/g, '');
    if (!esIsbnValido(soloNumeros)) {
      setProblemaDelIsbn(`El ISBN tiene que tener ${LARGO_DEL_ISBN} números. Lo encontrás abajo del código de barras.`);
      return;
    }
    setProblemaDelIsbn(null);
    alConfirmar(soloNumeros);
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>¿Preferís escribirlo? Poné el ISBN de 13 números:</Text>
      <TextInput
        value={isbnEscrito}
        onChangeText={setIsbnEscrito}
        onSubmitEditing={confirmarIsbn}
        placeholder="Por ejemplo: 9789500725347"
        placeholderTextColor={colores.textoSuave}
        keyboardType="number-pad"
        returnKeyType="search"
        maxLength={17}
        accessibilityLabel="ISBN del libro"
        style={estilos.campo}
      />
      {problemaDelIsbn ? <Text style={estilos.problema}>{problemaDelIsbn}</Text> : null}
      <Boton texto="Abrir libro" icono="book-outline" alTocar={confirmarIsbn} />
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { gap: ESPACIO.chico, padding: ESPACIO.grande },
    etiqueta: { color: colores.texto, fontSize: TAMANIO_LETRA.normal },
    campo: {
      minHeight: AREA_TACTIL_MINIMA,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: BORDE_REDONDEADO,
      paddingHorizontal: ESPACIO.medio,
      fontSize: TAMANIO_LETRA.grande,
      color: colores.texto,
      backgroundColor: colores.superficie,
    },
    problema: { color: colores.peligro, fontSize: TAMANIO_LETRA.chica },
  });
}
