import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  CANTIDAD_DE_VISTOS_RECIENTES,
  CLAVE_DEL_PERSONAL,
  DIAS_DE_PRESTAMO,
  MI_NOMBRE_EN_LA_LISTA,
  USUARIO_DEL_PERSONAL,
} from '../constants/biblioteca';
import { LISTAS_DE_ESPERA_INICIALES } from '../data/libros';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import { guardarEstado, leerEstadoGuardado } from '../lib/almacenamiento';
import { calcularEjemplaresDisponibles, encontrarLibroPorIsbn } from '../lib/catalogo';
import { formatearFechaLinda, inventarIdUnico, sumarDiasDesdeHoy } from '../lib/fechas';
import {
  avisarQueTeTocaElLibro,
  cancelarRecordatorio,
  obtenerIdsTodaviaProgramados,
  programarRecordatorioDeDevolucion,
  tengoPermisoDeNotificaciones,
} from '../lib/notificaciones';
import type {
  AvisoEnLaApp,
  Libro,
  Prestamo,
  ReservaEnEspera,
  ResultadoDeEntregar,
  ResultadoDeReservar,
  ResultadoDelRecordatorio,
} from '../types';

type ListasDeEspera = Record<string, Cola<string>>;

export type ValorDeLaBiblioteca = {
  estaListo: boolean;
  prestamos: Prestamo[];
  reservasEnEspera: ReservaEnEspera[];
  listasDeEspera: ListasDeEspera;
  ultimosVistos: Libro[];
  avisos: AvisoEnLaApp[];
  sesionIniciada: boolean;
  anotarComoVisto: (libro: Libro) => void;
  yaLoReserve: (isbn: string) => boolean;
  cuantosEsperan: (isbn: string) => number;
  ejemplaresDisponibles: (libro: Libro) => number;
  reservar: (isbn: string) => ResultadoDeReservar;
  devolver: (isbn: string) => Promise<void>;
  activarRecordatorio: (isbn: string) => Promise<ResultadoDelRecordatorio>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  entregarAlSiguiente: (isbn: string) => Promise<ResultadoDeEntregar>;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
  agregarAviso: (texto: string) => void;
  descartarAviso: (id: string) => void;
};

export const BibliotecaContext = createContext<ValorDeLaBiblioteca | null>(null);

function armarListasIniciales(listasPlanas: Record<string, string[]>): ListasDeEspera {
  const listasArmadas: ListasDeEspera = {};
  Object.entries(listasPlanas).forEach(([isbn, personas]) => {
    listasArmadas[isbn] = new Cola(personas);
  });
  return listasArmadas;
}

function aplanarListas(listas: ListasDeEspera): Record<string, string[]> {
  const listasPlanas: Record<string, string[]> = {};
  Object.entries(listas).forEach(([isbn, cola]) => {
    listasPlanas[isbn] = cola.aArray();
  });
  return listasPlanas;
}

type PropsDelProveedor = { children: ReactNode };

export function ProveedorDeBiblioteca({ children }: PropsDelProveedor) {
  const [estaListo, setEstaListo] = useState(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  // pila y colas son clases con estado adentro: nunca las mutamos, siempre las reemplazamos por un clon
  const [pilaDeRecientes, setPilaDeRecientes] = useState(() => new Pila<Libro>());
  const [listasDeEspera, setListasDeEspera] = useState<ListasDeEspera>(() =>
    armarListasIniciales(LISTAS_DE_ESPERA_INICIALES),
  );
  const [avisos, setAvisos] = useState<AvisoEnLaApp[]>([]);
  const [sesionIniciada, setSesionIniciada] = useState(false);

  // al arrancar: leemos lo guardado en el teléfono (la splash queda visible mientras tanto)
  useEffect(() => {
    let sigueMontado = true;

    async function recuperarLoGuardado() {
      const guardado = await leerEstadoGuardado();
      const idsVigentes = guardado ? await obtenerIdsTodaviaProgramados().catch(() => new Set<string>()) : null;
      if (!sigueMontado) {
        return;
      }
      if (guardado && idsVigentes) {
        // si un recordatorio ya sonó con la app cerrada, su id quedó viejo: lo limpiamos
        setPrestamos(
          guardado.prestamos.map((prestamo) =>
            prestamo.idDeLaNotificacion && !idsVigentes.has(prestamo.idDeLaNotificacion)
              ? { ...prestamo, idDeLaNotificacion: null }
              : prestamo,
          ),
        );
        setPilaDeRecientes(new Pila(guardado.recientes));
        setListasDeEspera(armarListasIniciales(guardado.listasDeEspera));
        setAvisos(guardado.avisos);
      }
      setEstaListo(true);
    }

    recuperarLoGuardado();
    return () => {
      sigueMontado = false;
    };
  }, []);

  // cada cambio se guarda, con una pausita para no escribir el disco diez veces seguidas
  useEffect(() => {
    if (!estaListo) {
      return;
    }
    const temporizadorDeGuardado = setTimeout(() => {
      guardarEstado({
        prestamos,
        recientes: pilaDeRecientes.aArray(),
        listasDeEspera: aplanarListas(listasDeEspera),
        avisos,
      });
    }, 250);
    return () => clearTimeout(temporizadorDeGuardado);
  }, [estaListo, prestamos, pilaDeRecientes, listasDeEspera, avisos]);

  const agregarAviso = useCallback((texto: string) => {
    setAvisos((avisosAnteriores) => [{ id: inventarIdUnico(), texto }, ...avisosAnteriores]);
  }, []);

  const descartarAviso = useCallback((id: string) => {
    setAvisos((avisosAnteriores) => avisosAnteriores.filter((aviso) => aviso.id !== id));
  }, []);

  const anotarComoVisto = useCallback((libro: Libro) => {
    setPilaDeRecientes((pilaAnterior) => {
      // si ya está arriba de todo no lo apilamos de nuevo (y devolvemos la misma pila: cero renders de más)
      if (pilaAnterior.verTope()?.isbn === libro.isbn) {
        return pilaAnterior;
      }
      const pilaNueva = pilaAnterior.clonar();
      pilaNueva.apilar(libro);
      return pilaNueva;
    });
  }, []);

  const yaLoReserve = useCallback(
    (isbn: string) =>
      prestamos.some((prestamo) => prestamo.isbn === isbn) ||
      (listasDeEspera[isbn]?.aArray().includes(MI_NOMBRE_EN_LA_LISTA) ?? false),
    [prestamos, listasDeEspera],
  );

  const cuantosEsperan = useCallback((isbn: string) => listasDeEspera[isbn]?.tamanio ?? 0, [listasDeEspera]);

  const ejemplaresDisponibles = useCallback(
    (libro: Libro) => calcularEjemplaresDisponibles(libro, prestamos),
    [prestamos],
  );

  const reservar = useCallback(
    (isbn: string): ResultadoDeReservar => {
      const libro = encontrarLibroPorIsbn(isbn);
      if (!libro) {
        return { tipo: 'libro-inexistente' };
      }
      if (yaLoReserve(isbn)) {
        return { tipo: 'ya-lo-tenias' };
      }

      if (calcularEjemplaresDisponibles(libro, prestamos) > 0) {
        const fechaDeDevolucion = sumarDiasDesdeHoy(DIAS_DE_PRESTAMO);
        const prestamoNuevo: Prestamo = {
          isbn,
          titulo: libro.titulo,
          fechaDeDevolucion,
          origen: 'estante',
          idDeLaNotificacion: null,
        };
        // doble chequeo adentro del updater por si alguien toca "confirmar" dos veces rapidísimo
        setPrestamos((anteriores) => (anteriores.some((p) => p.isbn === isbn) ? anteriores : [...anteriores, prestamoNuevo]));
        agregarAviso(`Listo, te llevás "${libro.titulo}". Devolvelo el ${formatearFechaLinda(fechaDeDevolucion)}.`);
        return { tipo: 'prestamo', fechaDeDevolucion };
      }

      const posicion = (listasDeEspera[isbn]?.tamanio ?? 0) + 1;
      setListasDeEspera((listasAnteriores) => {
        const colaVieja = listasAnteriores[isbn] ?? new Cola<string>();
        if (colaVieja.aArray().includes(MI_NOMBRE_EN_LA_LISTA)) {
          return listasAnteriores;
        }
        const colaNueva = colaVieja.clonar();
        colaNueva.encolar(MI_NOMBRE_EN_LA_LISTA);
        return { ...listasAnteriores, [isbn]: colaNueva };
      });
      agregarAviso(`Te anotamos en la lista de espera de "${libro.titulo}". Estás en el puesto ${posicion}.`);
      return { tipo: 'lista-de-espera', posicion };
    },
    [prestamos, listasDeEspera, yaLoReserve, agregarAviso],
  );

  const devolver = useCallback(
    async (isbn: string) => {
      const prestamoQueSeVa = prestamos.find((prestamo) => prestamo.isbn === isbn);
      if (!prestamoQueSeVa) {
        return;
      }
      // si había recordatorio, lo cancelamos: no tiene sentido recordar algo que ya devolviste
      if (prestamoQueSeVa.idDeLaNotificacion) {
        await cancelarRecordatorio(prestamoQueSeVa.idDeLaNotificacion).catch(() => undefined);
      }
      setPrestamos((anteriores) => anteriores.filter((prestamo) => prestamo.isbn !== isbn));
      agregarAviso(`¡Gracias por devolver "${prestamoQueSeVa.titulo}"!`);
    },
    [prestamos, agregarAviso],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string): Promise<ResultadoDelRecordatorio> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return 'no-se-pudo';
      }
      if (!(await tengoPermisoDeNotificaciones())) {
        return 'falta-permiso';
      }
      try {
        const idNuevo = await programarRecordatorioDeDevolucion(prestamo.titulo);
        setPrestamos((anteriores) =>
          anteriores.map((p) => (p.isbn === isbn ? { ...p, idDeLaNotificacion: idNuevo } : p)),
        );
        return 'programado';
      } catch {
        return 'no-se-pudo';
      }
    },
    [prestamos],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string) => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.idDeLaNotificacion) {
        await cancelarRecordatorio(prestamo.idDeLaNotificacion).catch(() => undefined);
      }
      setPrestamos((anteriores) => anteriores.map((p) => (p.isbn === isbn ? { ...p, idDeLaNotificacion: null } : p)));
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string): Promise<ResultadoDeEntregar> => {
      const colaActual = listasDeEspera[isbn];
      const personaDelFrente = colaActual?.verFrente();
      const libro = encontrarLibroPorIsbn(isbn);
      if (!colaActual || personaDelFrente === undefined || !libro) {
        return { tipo: 'nadie-esperando' };
      }

      setListasDeEspera((listasAnteriores) => {
        const colaNueva = (listasAnteriores[isbn] ?? new Cola<string>()).clonar();
        colaNueva.desencolar();
        return { ...listasAnteriores, [isbn]: colaNueva };
      });

      const eraYo = personaDelFrente === MI_NOMBRE_EN_LA_LISTA;
      if (eraYo) {
        // el ejemplar que devolvieron va directo a mis préstamos
        setPrestamos((anteriores) => [
          ...anteriores.filter((p) => p.isbn !== isbn),
          {
            isbn,
            titulo: libro.titulo,
            fechaDeDevolucion: sumarDiasDesdeHoy(DIAS_DE_PRESTAMO),
            origen: 'lista-de-espera',
            idDeLaNotificacion: null,
          },
        ]);
        // consultamos el permiso justo ahora (no un valor guardado), porque pudo cambiar en ajustes
        const puedoNotificar = await tengoPermisoDeNotificaciones().catch(() => false);
        if (puedoNotificar) {
          await avisarQueTeTocaElLibro(libro.titulo).catch(() => agregarAviso(`¡Te toca! Ya podés retirar "${libro.titulo}".`));
        } else {
          agregarAviso(`¡Te toca! Ya podés retirar "${libro.titulo}" en el mostrador.`);
        }
      }
      return { tipo: 'entregado', persona: personaDelFrente, eraYo };
    },
    [listasDeEspera, agregarAviso],
  );

  const iniciarSesion = useCallback((usuario: string, clave: string) => {
    const datosCorrectos = usuario.trim().toLowerCase() === USUARIO_DEL_PERSONAL && clave === CLAVE_DEL_PERSONAL;
    if (datosCorrectos) {
      setSesionIniciada(true);
    }
    return datosCorrectos;
  }, []);

  const cerrarSesion = useCallback(() => setSesionIniciada(false), []);

  // datos derivados: se calculan a partir del estado, no se guardan aparte
  const ultimosVistos = useMemo(
    () => pilaDeRecientes.aArray().slice(-CANTIDAD_DE_VISTOS_RECIENTES).reverse(),
    [pilaDeRecientes],
  );

  const reservasEnEspera = useMemo(() => {
    const misEsperas: ReservaEnEspera[] = [];
    Object.entries(listasDeEspera).forEach(([isbn, cola]) => {
      const indiceEnLaFila = cola.aArray().indexOf(MI_NOMBRE_EN_LA_LISTA);
      const libro = encontrarLibroPorIsbn(isbn);
      if (indiceEnLaFila >= 0 && libro) {
        misEsperas.push({ isbn, titulo: libro.titulo, posicion: indiceEnLaFila + 1 });
      }
    });
    return misEsperas;
  }, [listasDeEspera]);

  const valor = useMemo<ValorDeLaBiblioteca>(
    () => ({
      estaListo,
      prestamos,
      reservasEnEspera,
      listasDeEspera,
      ultimosVistos,
      avisos,
      sesionIniciada,
      anotarComoVisto,
      yaLoReserve,
      cuantosEsperan,
      ejemplaresDisponibles,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      agregarAviso,
      descartarAviso,
    }),
    [
      estaListo,
      prestamos,
      reservasEnEspera,
      listasDeEspera,
      ultimosVistos,
      avisos,
      sesionIniciada,
      anotarComoVisto,
      yaLoReserve,
      cuantosEsperan,
      ejemplaresDisponibles,
      reservar,
      devolver,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      agregarAviso,
      descartarAviso,
    ],
  );

  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}
