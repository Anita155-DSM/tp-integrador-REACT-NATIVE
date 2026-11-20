import { StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { Boton } from '../../components/Boton';
import { BotonSoloIcono } from '../../components/BotonSoloIcono';
import { EstadoVacio } from '../../components/EstadoVacio';
import { ExplicacionDelPermiso } from '../../components/ExplicacionDelPermiso';
import type { PaletaDeColores } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';
import { useEstilos } from '../../hooks/useEstilos';
import { leerParametroDeTexto } from '../../lib/catalogo';
import { esRecursoValido } from '../../lib/permisos';
import type { EstadoDelPermiso } from '../../types';

export default function PantallaPreviaDelPermiso() {
  const estilos = useEstilos(armarEstilos);
  // isbn llega solo cuando venimos del interruptor "Recordarme"
  const { recurso: recursoDeLaUrl, isbn: isbnDeLaUrl } = useLocalSearchParams<{ recurso: string; isbn?: string }>();
  const recurso = leerParametroDeTexto(recursoDeLaUrl);
  const isbnDelPrestamo = leerParametroDeTexto(isbnDeLaUrl);
  const { activarRecordatorio, agregarAviso } = useBiblioteca();

  function cerrar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function alTerminar(estadoFinal: EstadoDelPermiso) {
    // si la persona dijo que sí desde el interruptor, terminamos lo que había empezado
    if (recurso === 'notificaciones' && estadoFinal === 'concedido' && isbnDelPrestamo !== '') {
      const resultado = await activarRecordatorio(isbnDelPrestamo);
      if (resultado === 'programado') {
        agregarAviso('Listo: te mandamos el recordatorio en unos segundos (modo demostración).');
      }
    }
    if (recurso === 'notificaciones' && estadoFinal !== 'concedido') {
      agregarAviso('Sin notificaciones no pasa nada: los avisos te van a aparecer acá, dentro de la app.');
    }
    cerrar();
  }

  return (
    <View style={estilos.pantalla}>
      <Stack.Screen
        options={{ headerRight: () => <BotonSoloIcono icono="close" etiquetaAccesible="Cerrar sin dar permiso" alTocar={cerrar} /> }}
      />
      {esRecursoValido(recurso) ? (
        <ExplicacionDelPermiso recurso={recurso} alTerminar={alTerminar} />
      ) : (
        <EstadoVacio icono="help-circle-outline" mensaje="Esta app solo pide permiso de cámara y de notificaciones.">
          <Boton texto="Cerrar" alTocar={cerrar} />
        </EstadoVacio>
      )}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
  });
}
