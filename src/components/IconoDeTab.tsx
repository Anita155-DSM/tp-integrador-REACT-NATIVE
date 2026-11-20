import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PropsDelIconoDeTab = {
  nombre: ComponentProps<typeof Ionicons>['name'];
  color: ColorValue;
  tamanio: number;
};

// la barra de tabs nos pasa un ColorValue (que puede ser null); al ícono le sirve solo el texto del color
export function IconoDeTab({ nombre, color, tamanio }: PropsDelIconoDeTab) {
  const colorComoTexto = typeof color === 'string' ? color : undefined;
  return <Ionicons name={nombre} color={colorComoTexto} size={tamanio} />;
}
