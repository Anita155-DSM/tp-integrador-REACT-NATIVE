import { LARGO_DEL_ISBN } from '../constants/biblioteca';
import { LIBROS } from '../data/libros';
import type { Libro, Prestamo } from '../types';

const SOLO_TRECE_DIGITOS = new RegExp(`^\\d{${LARGO_DEL_ISBN}}$`);

// useLocalSearchParams puede traer string, string[] o undefined: acá lo dejamos prolijo
export function leerParametroDeTexto(valorCrudo: string | string[] | undefined): string {
  if (Array.isArray(valorCrudo)) {
    return valorCrudo[0] ?? '';
  }
  return valorCrudo ?? '';
}

export function esIsbnValido(posibleIsbn: string): boolean {
  return SOLO_TRECE_DIGITOS.test(posibleIsbn);
}

// búsqueda local y sincrónica: la usan el detalle, el escáner y el mostrador
export function encontrarLibroPorIsbn(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}

// los ejemplares disponibles no se guardan en ningún lado: se calculan.
// solo restan los préstamos que salieron del estante; los que vienen de la lista de espera
// son ejemplares que alguien devolvió y fueron directo a la próxima persona.
export function calcularEjemplaresDisponibles(libro: Libro, prestamos: Prestamo[]): number {
  const sacadosDelEstante = prestamos.filter(
    (prestamo) => prestamo.isbn === libro.isbn && prestamo.origen === 'estante',
  ).length;
  return Math.max(0, libro.ejemplares - sacadosDelEstante);
}
