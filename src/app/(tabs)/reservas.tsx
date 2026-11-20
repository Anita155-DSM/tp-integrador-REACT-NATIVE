import { FlatList, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { CartelDeNotificaciones } from '../../components/CartelDeNotificaciones';
import { EnlaceAlCatalogo } from '../../components/EnlaceAlCatalogo';
import { EstadoVacio } from '../../components/EstadoVacio';
import { ListaDeAvisos } from '../../components/ListaDeAvisos';
import { ListaDeMisEsperas } from '../../components/ListaDeMisEsperas';
import { TarjetaDePrestamo } from '../../components/TarjetaDePrestamo';
import { ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';
import { useEstilos } from '../../hooks/useEstilos';
import { usePermiso } from '../../hooks/usePermiso';

export default function PantallaDeMisReservas() {
  const estilos = useEstilos(armarEstilos);
  const {
    prestamos,
    reservasEnEspera,
    avisos,
    descartarAviso,
    agregarAviso,
    devolver,
    activarRecordatorio,
    desactivarRecordatorio,
  } = useBiblioteca();
  // acá solo CONSULTAMOS el permiso (para el cartel); pedirlo se pide recién al prender "Recordarme"
  const { estado: estadoDeLasNotificaciones } = usePermiso('notificaciones');

  async function cambiarRecordatorio(isbn: string, quiereRecordatorio: boolean) {
    if (!quiereRecordatorio) {
      await desactivarRecordatorio(isbn);
      return;
    }
    const resultado = await activarRecordatorio(isbn);
    if (resultado === 'falta-permiso') {
      // primero la pantalla previa con el beneficio, después (si dice que sí) el cartel del sistema
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'notificaciones', isbn } });
    } else if (resultado === 'no-se-pudo') {
      agregarAviso('No pudimos programar el recordatorio. Probá de nuevo en un rato.');
    } else {
      agregarAviso('Listo: te mandamos el recordatorio en unos segundos (modo demostración).');
    }
  }

  return (
    <FlatList
      style={estilos.lista}
      data={prestamos}
      keyExtractor={(prestamo) => prestamo.isbn}
      renderItem={({ item }) => (
        <TarjetaDePrestamo
          prestamo={item}
          alCambiarRecordatorio={(quiere) => cambiarRecordatorio(item.isbn, quiere)}
          alDevolver={() => devolver(item.isbn)}
        />
      )}
      ListHeaderComponent={
        <>
          <CartelDeNotificaciones estado={estadoDeLasNotificaciones} />
          <ListaDeAvisos avisos={avisos} alDescartar={descartarAviso} />
          <Text style={estilos.subtitulo} accessibilityRole="header">
            Mis préstamos
          </Text>
        </>
      }
      ListEmptyComponent={
        <EstadoVacio icono="book-outline" mensaje="No tenés libros prestados por ahora.">
          <EnlaceAlCatalogo texto="Buscar algo para leer" />
        </EstadoVacio>
      }
      ListFooterComponent={<ListaDeMisEsperas reservas={reservasEnEspera} />}
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
    },
  });
}
