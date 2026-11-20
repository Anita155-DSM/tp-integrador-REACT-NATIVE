import type { PermissionResponse } from 'expo-camera';
import * as Notifications from 'expo-notifications';

import { RECURSOS_VALIDOS } from '../constants/permisos';
import type { EstadoDelPermiso, RecursoConPermiso } from '../types';
import { crearCanalDePrestamos } from './notificaciones';

// traduce la respuesta del sistema a los cuatro estados que maneja la app.
// clave: con status solo no alcanza, porque "denied" puede ser "te pregunto de nuevo" o "bloqueado para siempre".
export function traducirRespuestaDelPermiso(respuesta: PermissionResponse | null): EstadoDelPermiso {
  if (respuesta === null) {
    return 'cargando';
  }
  if (respuesta.granted) {
    return 'concedido';
  }
  return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';
}

export function esRecursoValido(posibleRecurso: string): posibleRecurso is RecursoConPermiso {
  return RECURSOS_VALIDOS.some((recurso) => recurso === posibleRecurso);
}

export async function consultarPermisoDeNotificaciones(): Promise<PermissionResponse> {
  return Notifications.getPermissionsAsync();
}

// en android 13+ el canal tiene que existir antes de pedir, si no el cartel no aparece
export async function pedirPermisoDeNotificaciones(): Promise<PermissionResponse> {
  await crearCanalDePrestamos();
  return Notifications.requestPermissionsAsync();
}
