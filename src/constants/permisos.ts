import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { RecursoConPermiso } from '../types';

type TextosDelPermiso = {
  titulo: string;
  beneficio: string;
  siEstaBloqueado: string;
  icono: ComponentProps<typeof Ionicons>['name'];
};

// lo que ve la persona en la pantalla previa, antes del cartel del sistema
export const TEXTOS_DE_PERMISOS: Record<RecursoConPermiso, TextosDelPermiso> = {
  camara: {
    titulo: 'Cámara',
    beneficio: 'Usamos tu cámara para leer el código de barras del libro y abrirte su ficha al toque.',
    siEstaBloqueado:
      'La cámara está bloqueada para esta app. Podés habilitarla desde Ajustes o escribir el ISBN a mano.',
    icono: 'camera-outline',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio: 'Usamos tus notificaciones para recordarte cuándo devolver el libro y avisarte cuando te toca uno.',
    siEstaBloqueado:
      'Las notificaciones están bloqueadas. Podés habilitarlas desde Ajustes; mientras tanto te avisamos dentro de la app.',
    icono: 'notifications-outline',
  },
};

export const RECURSOS_VALIDOS: RecursoConPermiso[] = ['camara', 'notificaciones'];
