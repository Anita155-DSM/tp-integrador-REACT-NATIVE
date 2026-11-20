const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export function sumarDiasDesdeHoy(cantidadDeDias: number): string {
  return new Date(Date.now() + cantidadDeDias * MILISEGUNDOS_POR_DIA).toISOString();
}

// "lunes 23/11" queda más amigable que una fecha iso
export function formatearFechaLinda(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

// id sencillo para los avisos; no hace falta nada criptográfico
export function inventarIdUnico(): string {
  return `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}
