import { Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { AREA_TACTIL_MINIMA, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useEstilos } from '../hooks/useEstilos';

// link del header: sin sesión lleva al login, con sesión directo al mostrador
export function EnlacePersonal() {
  const estilos = useEstilos(armarEstilos);
  const { sesionIniciada } = useBiblioteca();

  return (
    <Link href={sesionIniciada ? '/mostrador' : '/login'} asChild>
      <Pressable accessibilityRole="button" style={estilos.boton}>
        <Text style={estilos.texto}>{sesionIniciada ? 'Mostrador' : 'Personal'}</Text>
      </Pressable>
    </Link>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    boton: { minHeight: AREA_TACTIL_MINIMA, minWidth: AREA_TACTIL_MINIMA, justifyContent: 'center', paddingHorizontal: ESPACIO.chico },
    texto: { color: colores.primario, fontSize: TAMANIO_LETRA.normal, fontWeight: PESO_LETRA.fuerte },
  });
}
