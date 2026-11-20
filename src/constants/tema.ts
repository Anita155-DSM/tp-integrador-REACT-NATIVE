// todos los colores, tamaños y espaciados de la app viven acá.
// si algún día cambia la identidad visual de la biblioteca, se toca solo este archivo.

export type PaletaDeColores = {
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  textoSuave: string;
  primario: string;
  textoSobrePrimario: string;
  exito: string;
  fondoExito: string;
  peligro: string;
  fondoPeligro: string;
  aviso: string;
  fondoAviso: string;
};

const coloresDeDia: PaletaDeColores = {
  fondo: '#F5F7FA',
  superficie: '#FFFFFF',
  borde: '#D9DEE5',
  texto: '#1B2430',
  textoSuave: '#5B6676',
  primario: '#1F4E79',
  textoSobrePrimario: '#FFFFFF',
  exito: '#1E7B46',
  fondoExito: '#E3F4EA',
  peligro: '#B3261E',
  fondoPeligro: '#FBE7E6',
  aviso: '#8A5A00',
  fondoAviso: '#FFF3D6',
};

const coloresDeNoche: PaletaDeColores = {
  fondo: '#10151C',
  superficie: '#1A212B',
  borde: '#2E3846',
  texto: '#EEF2F6',
  textoSuave: '#A3AEBD',
  primario: '#7FB2E5',
  textoSobrePrimario: '#0B1A2A',
  exito: '#6FD39B',
  fondoExito: '#163325',
  peligro: '#F2938C',
  fondoPeligro: '#3A1B19',
  aviso: '#F2C46B',
  fondoAviso: '#3A2E12',
};

export const COLORES = {
  claro: coloresDeDia,
  oscuro: coloresDeNoche,
};

export const ESPACIO = {
  chiquito: 4,
  chico: 8,
  medio: 12,
  grande: 16,
  enorme: 24,
};

export const TAMANIO_LETRA = {
  chica: 13,
  normal: 15,
  grande: 18,
  titulo: 22,
};

export const PESO_LETRA = {
  normal: '400',
  fuerte: '600',
  negrita: '700',
} as const;

export const BORDE_REDONDEADO = 10;

// pedido de accesibilidad: nada que se toque puede medir menos de 44 x 44
export const AREA_TACTIL_MINIMA = 44;

export const TAMANIO_ICONO = 22;
