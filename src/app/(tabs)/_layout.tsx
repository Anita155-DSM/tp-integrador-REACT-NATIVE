import { Tabs } from 'expo-router/js-tabs';

import { IconoDeTab } from '../../components/IconoDeTab';
import { useBiblioteca } from '../../hooks/useBiblioteca';

// en el sdk 58 las tabs de javascript se importan de 'expo-router/js-tabs' (las de 'expo-router' quedaron deprecadas)
export default function LayoutDeLasTabs() {
  const { avisos } = useBiblioteca();

  return (
    <Tabs>
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <IconoDeTab nombre="library-outline" color={color} tamanio={size} />,
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarBadge: avisos.length > 0 ? avisos.length : undefined,
          tabBarIcon: ({ color, size }) => <IconoDeTab nombre="bookmarks-outline" color={color} tamanio={size} />,
        }}
      />
    </Tabs>
  );
}
