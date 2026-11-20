import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ESPACIO } from '../constants/tema';
import { usePermiso } from '../hooks/usePermiso';
import { Boton } from './Boton';

// los dos atajos de arriba del catálogo
export function AccesosRapidos() {
  // solo consultamos (no pedimos): sirve para saber si hay que mostrar antes la pantalla previa
  const { estado: estadoDeLaCamara } = usePermiso('camara');

  function abrirEscaner() {
    router.push('/escanear');
    // sin permiso, arriba del escáner aparece la explicación; el cartel del sistema recién después de "Continuar"
    if (estadoDeLaCamara === 'preguntable' || estadoDeLaCamara === 'bloqueado') {
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } });
    }
  }

  return (
    <View style={estilos.fila}>
      <View style={estilos.mitad}>
        <Boton texto="Buscar" icono="search" variante="secundario" alTocar={() => router.push('/buscar')} />
      </View>
      <View style={estilos.mitad}>
        <Boton texto="Escanear" icono="barcode-outline" variante="secundario" alTocar={abrirEscaner} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: ESPACIO.chico, paddingHorizontal: ESPACIO.grande, paddingTop: ESPACIO.grande },
  mitad: { flex: 1 },
});
