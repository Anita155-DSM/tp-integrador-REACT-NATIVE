import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AvisoEnLaApp, Libro, Prestamo } from '../types';

const CLAVE_DE_GUARDADO = 'biblioteca-ipf:estado-v1';

// lo que guardamos en el teléfono: datos planos, nada de clases (las clases no sobreviven a json)
export type EstadoGuardado = {
  prestamos: Prestamo[];
  recientes: Libro[];
  listasDeEspera: Record<string, string[]>;
  avisos: AvisoEnLaApp[];
};

export async function leerEstadoGuardado(): Promise<EstadoGuardado | null> {
  try {
    const textoGuardado = await AsyncStorage.getItem(CLAVE_DE_GUARDADO);
    return textoGuardado ? (JSON.parse(textoGuardado) as EstadoGuardado) : null;
  } catch {
    // si el guardado está roto arrancamos de cero en vez de dejar la app colgada
    return null;
  }
}

export async function guardarEstado(estadoParaGuardar: EstadoGuardado): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_DE_GUARDADO, JSON.stringify(estadoParaGuardar));
  } catch {
    // no poder guardar no es grave: la app sigue andando, solo que no recuerda al reabrir
  }
}
