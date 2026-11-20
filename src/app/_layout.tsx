import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ProveedorDeBiblioteca } from '../context/BibliotecaContext';
import { useBiblioteca } from '../hooks/useBiblioteca';
import { useColores } from '../hooks/useColores';
import { mostrarNotificacionesConLaAppAbierta } from '../lib/notificaciones';
import { armarTemaDeNavegacion } from '../lib/temaDeNavegacion';

// la splash queda arriba hasta que terminamos de leer lo guardado: así la app nunca se ve "vacía"
SplashScreen.preventAutoHideAsync();
mostrarNotificacionesConLaAppAbierta();

// un deep link a /buscar (o a cualquier pantalla de la raíz) deja las tabs debajo en la pila
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function LayoutRaiz() {
  return (
    <ProveedorDeBiblioteca>
      <PilaRaiz />
    </ProveedorDeBiblioteca>
  );
}

// está en este mismo archivo a propósito: el guard de Stack.Protected necesita leer la sesión del context,
// y el context recién existe adentro del proveedor que monta LayoutRaiz (es el patrón de la doc de expo)
function PilaRaiz() {
  const { sesionIniciada, estaListo } = useBiblioteca();
  const colores = useColores();
  const esModoOscuro = useColorScheme() === 'dark';
  const temaDeNavegacion = useMemo(() => armarTemaDeNavegacion(colores, esModoOscuro), [colores, esModoOscuro]);

  useEffect(() => {
    if (estaListo) {
      SplashScreen.hideAsync();
    }
  }, [estaListo]);

  return (
    <ThemeProvider value={temaDeNavegacion}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
        <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
        <Stack.Screen name="reservar/[isbn]" options={{ presentation: 'modal', title: 'Confirmar reserva' }} />
        <Stack.Screen name="permisos/[recurso]" options={{ presentation: 'modal', title: 'Antes de seguir' }} />

        {/* el login solo existe si NO hay sesión: cuando entrás, desaparece solo */}
        <Stack.Protected guard={!sesionIniciada}>
          <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Ingreso del personal' }} />
        </Stack.Protected>

        {/* el mostrador solo existe CON sesión: al cerrarla se va del historial */}
        <Stack.Protected guard={sesionIniciada}>
          <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
        </Stack.Protected>

        <Stack.Screen name="reserva" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Ups' }} />
      </Stack>
    </ThemeProvider>
  );
}
