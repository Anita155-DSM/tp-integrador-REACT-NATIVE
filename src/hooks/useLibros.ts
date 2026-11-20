import { useCallback, useEffect, useState } from 'react';

import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

type ResultadoDeUseLibros = {
  libros: Libro[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
};

const MENSAJE_SI_FALLA = 'No pudimos conectarnos con la biblioteca. Revisá tu conexión y probá de nuevo.';

export function useLibros(): ResultadoDeUseLibros {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // cada vez que este número cambia, el efecto vuelve a pedir los libros
  const [numeroDeIntento, setNumeroDeIntento] = useState(0);

  useEffect(() => {
    // si la pantalla se va antes de que llegue la respuesta, no tocamos el estado
    let sigueEnPantalla = true;

    obtenerLibros()
      .then((librosQueLlegaron) => {
        if (sigueEnPantalla) {
          setLibros(librosQueLlegaron);
          setCargando(false);
        }
      })
      .catch(() => {
        if (sigueEnPantalla) {
          setError(MENSAJE_SI_FALLA);
          setCargando(false);
        }
      });

    return () => {
      sigueEnPantalla = false;
    };
  }, [numeroDeIntento]);

  // el "cargando" se prende acá, en el evento, y no adentro del efecto
  const reintentar = useCallback(() => {
    setCargando(true);
    setError(null);
    setNumeroDeIntento((intentoAnterior) => intentoAnterior + 1);
  }, []);

  return { libros, cargando, error, reintentar };
}
