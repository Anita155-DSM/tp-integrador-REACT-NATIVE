import { useEffect, useState } from 'react';

import { DEMORA_DEL_BUSCADOR_MS } from '../constants/biblioteca';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

type RespuestaGuardada = {
  resultados: Libro[];
  error: string | null;
  // para qué texto es esta respuesta: así sabemos si sirve o es de una búsqueda vieja
  textoBuscado: string;
};

type ResultadoDeLaBusqueda = RespuestaGuardada & { buscando: boolean };

const MENSAJE_SI_FALLA = 'No pudimos buscar en este momento. Probá escribir de nuevo en un ratito.';

const SIN_RESPUESTA: RespuestaGuardada = { resultados: [], error: null, textoBuscado: '' };

export function useBusqueda(textoDeLaUrl: string): ResultadoDeLaBusqueda {
  const [ultimaRespuesta, setUltimaRespuesta] = useState<RespuestaGuardada>(SIN_RESPUESTA);
  const textoLimpio = textoDeLaUrl.trim();

  useEffect(() => {
    if (textoLimpio === '') {
      return;
    }

    // esta bandera es de ESTA búsqueda; cuando la persona escribe otra letra, la limpieza la apaga
    let esLaUltimaBusqueda = true;

    // debounce: esperamos a que deje de escribir 300 ms antes de molestar a la "api"
    const temporizador = setTimeout(() => {
      buscarLibros(textoLimpio)
        .then((librosEncontrados) => {
          if (esLaUltimaBusqueda) {
            setUltimaRespuesta({ resultados: librosEncontrados, error: null, textoBuscado: textoLimpio });
          }
        })
        .catch(() => {
          if (esLaUltimaBusqueda) {
            setUltimaRespuesta({ resultados: [], error: MENSAJE_SI_FALLA, textoBuscado: textoLimpio });
          }
        });
    }, DEMORA_DEL_BUSCADOR_MS);

    // corre antes de la próxima búsqueda (o al salir): corta el temporizador y descarta la respuesta vieja
    return () => {
      esLaUltimaBusqueda = false;
      clearTimeout(temporizador);
    };
  }, [textoLimpio]);

  // "buscando" no se guarda: se calcula. si la respuesta que tenemos no es del texto actual, estamos esperando
  const respuestaEsDeOtroTexto = ultimaRespuesta.textoBuscado !== textoLimpio;
  if (textoLimpio === '') {
    return { ...SIN_RESPUESTA, buscando: false };
  }
  if (respuestaEsDeOtroTexto) {
    return { resultados: [], error: null, textoBuscado: textoLimpio, buscando: true };
  }
  return { ...ultimaRespuesta, buscando: false };
}
