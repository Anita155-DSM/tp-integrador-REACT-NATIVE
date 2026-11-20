import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCameraPermissions, type PermissionResponse } from 'expo-camera';

import {
  consultarPermisoDeNotificaciones,
  pedirPermisoDeNotificaciones,
  traducirRespuestaDelPermiso,
} from '../lib/permisos';
import type { EstadoDelPermiso, RecursoConPermiso } from '../types';

type ResultadoDeUsePermiso = {
  estado: EstadoDelPermiso;
  pedir: () => Promise<EstadoDelPermiso>;
  abrirAjustes: () => Promise<void>;
  volverAConsultar: () => Promise<void>;
};

// mismo hook para los dos recursos de la app. la cámara usa useCameraPermissions (como pide la consigna)
// y las notificaciones usan las funciones de expo-notifications.
export function usePermiso(recurso: RecursoConPermiso): ResultadoDeUsePermiso {
  const esLaCamara = recurso === 'camara';
  const [respuestaDeCamara, pedirCamara, consultarCamara] = useCameraPermissions({ get: esLaCamara });
  const [respuestaDeNotificaciones, setRespuestaDeNotificaciones] = useState<PermissionResponse | null>(null);
  const sigueMontado = useRef(true);

  useEffect(() => {
    sigueMontado.current = true;
    return () => {
      sigueMontado.current = false;
    };
  }, []);

  const volverAConsultar = useCallback(async () => {
    if (esLaCamara) {
      await consultarCamara();
      return;
    }
    const respuestaNueva = await consultarPermisoDeNotificaciones();
    if (sigueMontado.current) {
      setRespuestaDeNotificaciones(respuestaNueva);
    }
  }, [esLaCamara, consultarCamara]);

  // 1) cada vez que la pantalla gana el foco (por ejemplo, al cerrarse el modal de permisos)
  useFocusEffect(
    useCallback(() => {
      volverAConsultar();
    }, [volverAConsultar]),
  );

  // 2) cada vez que la app vuelve a primer plano (por ejemplo, al volver de ajustes)
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoDeLaApp) => {
      if (estadoDeLaApp === 'active') {
        volverAConsultar();
      }
    });
    return () => suscripcion.remove();
  }, [volverAConsultar]);

  const pedir = useCallback(async (): Promise<EstadoDelPermiso> => {
    if (esLaCamara) {
      return traducirRespuestaDelPermiso(await pedirCamara());
    }
    const respuestaNueva = await pedirPermisoDeNotificaciones();
    if (sigueMontado.current) {
      setRespuestaDeNotificaciones(respuestaNueva);
    }
    return traducirRespuestaDelPermiso(respuestaNueva);
  }, [esLaCamara, pedirCamara]);

  const abrirAjustes = useCallback(() => Linking.openSettings(), []);

  const respuestaActual = esLaCamara ? respuestaDeCamara : respuestaDeNotificaciones;

  return {
    estado: traducirRespuestaDelPermiso(respuestaActual),
    pedir,
    abrirAjustes,
    volverAConsultar,
  };
}
