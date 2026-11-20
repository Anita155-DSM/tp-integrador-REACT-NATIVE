import type { Libro } from '../types';

// ojo: los dos primeros son los libros "que tengo a mano" para probar el escáner.
// si probás con otros, cambiá el isbn por el que figura abajo del código de barras de la contratapa.
export const LIBROS: Libro[] = [
  { isbn: '9789500725347', titulo: 'Ficciones', autor: 'Jorge Luis Borges', anio: 1944, ejemplares: 2 },
  { isbn: '9789870434870', titulo: 'Rayuela', autor: 'Julio Cortázar', anio: 1963, ejemplares: 1 },
  { isbn: '9789875666474', titulo: 'El Aleph', autor: 'Jorge Luis Borges', anio: 1949, ejemplares: 0 },
  { isbn: '9789504930570', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, ejemplares: 3 },
  { isbn: '9789875804968', titulo: 'El túnel', autor: 'Ernesto Sabato', anio: 1948, ejemplares: 0 },
  { isbn: '9789500398442', titulo: 'Martín Fierro', autor: 'José Hernández', anio: 1872, ejemplares: 4 },
  { isbn: '9789871138449', titulo: 'Clean Code', autor: 'Robert C. Martin', anio: 2008, ejemplares: 1 },
  { isbn: '9780132350884', titulo: 'Código limpio (edición en inglés)', autor: 'Robert C. Martin', anio: 2008, ejemplares: 0 },
  { isbn: '9788441539327', titulo: 'JavaScript: la guía definitiva', autor: 'David Flanagan', anio: 2020, ejemplares: 2 },
  { isbn: '9781491952023', titulo: 'Learning React', autor: 'Alex Banks y Eve Porcello', anio: 2020, ejemplares: 1 },
  { isbn: '9789500437059', titulo: 'Historias de cronopios y de famas', autor: 'Julio Cortázar', anio: 1962, ejemplares: 2 },
  { isbn: '9789877380309', titulo: 'Borges esencial', autor: 'Jorge Luis Borges', anio: 2017, ejemplares: 1 },
  { isbn: '9789504972075', titulo: 'Las aventuras de la China Iron', autor: 'Gabriela Cabezón Cámara', anio: 2017, ejemplares: 1 },
  { isbn: '9789873743412', titulo: 'Nuestra parte de noche', autor: 'Mariana Enriquez', anio: 2019, ejemplares: 0 },
  { isbn: '9789877386134', titulo: 'Distancia de rescate', autor: 'Samanta Schweblin', anio: 2014, ejemplares: 2 },
  { isbn: '9789500755542', titulo: 'Operación masacre', autor: 'Rodolfo Walsh', anio: 1957, ejemplares: 1 },
];

// gente que ya estaba esperando cuando arranca la app (solo en libros sin ejemplares)
export const LISTAS_DE_ESPERA_INICIALES: Record<string, string[]> = {
  '9789875666474': ['Lucía Benítez', 'Matías Giménez'],
  '9789873743412': ['Sofía Ayala'],
};
