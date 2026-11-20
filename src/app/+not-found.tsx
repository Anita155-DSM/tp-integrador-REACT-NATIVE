import { StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';

import { EnlaceAlCatalogo } from '../components/EnlaceAlCatalogo';
import { EstadoVacio } from '../components/EstadoVacio';
import type { PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';

export default function PantallaNoEncontrada() {
  const estilos = useEstilos(armarEstilos);
  const direccionQueNoExiste = usePathname();

  return (
    <View style={estilos.pantalla}>
      <EstadoVacio icono="compass-outline" mensaje={`La dirección "${direccionQueNoExiste}" no existe en la app.`}>
        <EnlaceAlCatalogo />
      </EstadoVacio>
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, justifyContent: 'center', backgroundColor: colores.fondo },
  });
}
