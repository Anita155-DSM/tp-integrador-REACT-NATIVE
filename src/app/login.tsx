import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Boton } from '../components/Boton';
import { AREA_TACTIL_MINIMA, BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';

export default function PantallaDeLogin() {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  const { iniciarSesion } = useBiblioteca();
  const [usuarioEscrito, setUsuarioEscrito] = useState('');
  const [claveEscrita, setClaveEscrita] = useState('');
  const [datosIncorrectos, setDatosIncorrectos] = useState(false);

  // al prenderse la sesión, Stack.Protected saca este modal solito (su guard pasa a false).
  // el replace es para caer directo en el mostrador: sin él, expo-router rellena el hueco del login
  // con otra copia de las tabs y quedan dos catálogos apilados (lo vimos en un test de navegación)
  function intentarEntrar() {
    const entro = iniciarSesion(usuarioEscrito, claveEscrita);
    setDatosIncorrectos(!entro);
    if (entro) {
      router.replace('/mostrador');
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.explicacion}>Este ingreso es solo para el personal de la biblioteca.</Text>
      <TextInput
        value={usuarioEscrito}
        onChangeText={setUsuarioEscrito}
        placeholder="Usuario"
        placeholderTextColor={colores.textoSuave}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Usuario del personal"
        style={estilos.campo}
      />
      <TextInput
        value={claveEscrita}
        onChangeText={setClaveEscrita}
        onSubmitEditing={intentarEntrar}
        placeholder="Clave"
        placeholderTextColor={colores.textoSuave}
        secureTextEntry
        accessibilityLabel="Clave del personal"
        style={estilos.campo}
      />
      {datosIncorrectos ? (
        <Text style={estilos.error} accessibilityRole="alert">
          El usuario o la clave no coinciden. Fijate si están bien escritos y probá de nuevo.
        </Text>
      ) : null}
      <Boton texto="Ingresar" icono="log-in-outline" alTocar={intentarEntrar} />
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, padding: ESPACIO.enorme, gap: ESPACIO.medio, backgroundColor: colores.fondo },
    explicacion: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.normal },
    campo: {
      minHeight: AREA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.superficie,
      color: colores.texto,
      fontSize: TAMANIO_LETRA.grande,
    },
    error: { color: colores.peligro, fontSize: TAMANIO_LETRA.chica },
  });
}
