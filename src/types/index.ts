export type Libro = {
  isbn: string;                // 13 dígitos, sin guiones
  titulo: string;
  autor: string;
  anio: number;
  ejemplares: number;          // ejemplares en el estante al iniciar la app
};

// de dónde salió el ejemplar: del estante o de la lista de espera (lo entregó el mostrador)
export type OrigenDelPrestamo = 'estante' | 'lista-de-espera';

export type Prestamo = {
  isbn: string;
  titulo: string;
  fechaDeDevolucion: string;           // fecha en formato iso, así se guarda sin drama en async storage
  origen: OrigenDelPrestamo;
  idDeLaNotificacion: string | null;   // null cuando no hay recordatorio programado
};

// una reserva en espera no se guarda: se calcula mirando las colas de cada libro
export type ReservaEnEspera = {
  isbn: string;
  titulo: string;
  posicion: number;
};

export type AvisoEnLaApp = {
  id: string;
  texto: string;
};

export type ResultadoDeReservar =
  | { tipo: 'prestamo'; fechaDeDevolucion: string }
  | { tipo: 'lista-de-espera'; posicion: number }
  | { tipo: 'ya-lo-tenias' }
  | { tipo: 'libro-inexistente' };

export type ResultadoDeEntregar =
  | { tipo: 'entregado'; persona: string; eraYo: boolean }
  | { tipo: 'nadie-esperando' };

export type ResultadoDelRecordatorio = 'programado' | 'falta-permiso' | 'no-se-pudo';

export type RecursoConPermiso = 'camara' | 'notificaciones';

export type EstadoDelPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';
