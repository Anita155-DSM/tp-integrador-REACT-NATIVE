import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { CANAL_DE_PRESTAMOS, SEGUNDOS_HASTA_EL_RECORDATORIO } from '../constants/biblioteca';

// sin esto, si la app está abierta la notificación llega "en silencio" y no se ve nada
export function mostrarNotificacionesConLaAppAbierta(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// el canal solo existe en android; en ios esta función no hace nada
export async function crearCanalDePrestamos(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CANAL_DE_PRESTAMOS, {
    name: 'Préstamos de la biblioteca',
    description: 'Recordatorios de devolución y avisos cuando te toca un libro.',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function tengoPermisoDeNotificaciones(): Promise<boolean> {
  const respuesta = await Notifications.getPermissionsAsync();
  return respuesta.granted;
}

// devuelve el identificador para poder cancelarla después
export async function programarRecordatorioDeDevolucion(tituloDelLibro: string): Promise<string> {
  await crearCanalDePrestamos();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Acordate de devolver el libro',
      body: `Se te vence el préstamo de "${tituloDelLibro}". Pasá por la biblioteca así lo disfruta otra persona.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_HASTA_EL_RECORDATORIO,
      channelId: CANAL_DE_PRESTAMOS,
    },
  });
}

export async function cancelarRecordatorio(idDeLaNotificacion: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(idDeLaNotificacion);
}

// aviso inmediato cuando el mostrador te entrega el libro que esperabas
export async function avisarQueTeTocaElLibro(tituloDelLibro: string): Promise<void> {
  await crearCanalDePrestamos();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '¡Te toca!',
      body: `Ya podés retirar "${tituloDelLibro}" en el mostrador de la biblioteca.`,
    },
    trigger: Platform.OS === 'android' ? { channelId: CANAL_DE_PRESTAMOS } : null,
  });
}

// sirve al arrancar: si una notificación ya sonó mientras la app estaba cerrada, su id quedó viejo
export async function obtenerIdsTodaviaProgramados(): Promise<Set<string>> {
  const pendientes = await Notifications.getAllScheduledNotificationsAsync();
  return new Set(pendientes.map((notificacion) => notificacion.identifier));
}
