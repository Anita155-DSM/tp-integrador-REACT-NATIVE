import { Stack } from 'expo-router';

import { EnlacePersonal } from '../../../components/EnlacePersonal';

// si entrás directo a /libro/... por un deep link, el catálogo queda debajo para poder volver
export const unstable_settings = {
  anchor: 'index',
};

export default function LayoutDelCatalogo() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Catálogo', headerRight: () => <EnlacePersonal /> }} />
      <Stack.Screen name="libro/[isbn]" options={{ title: 'Libro' }} />
    </Stack>
  );
}
