import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ESPACIO } from '../constants/tema';
import { Boton } from './Boton';

// los dos atajos de arriba del catálogo
export function AccesosRapidos() {
  return (
    <View style={estilos.fila}>
      <View style={estilos.mitad}>
        <Boton texto="Buscar" icono="search" variante="secundario" alTocar={() => router.push('/buscar')} />
      </View>
      <View style={estilos.mitad}>
        <Boton texto="Escanear" icono="barcode-outline" variante="secundario" alTocar={() => router.push('/escanear')} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: ESPACIO.chico, paddingHorizontal: ESPACIO.grande, paddingTop: ESPACIO.grande },
  mitad: { flex: 1 },
});
