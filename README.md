
# Biblioteca IPF

TP N° 4 de **React Native II** (Tecnicatura Superior en Desarrollo de Software Multiplataforma, Instituto Politécnico Formosa).

Es una app para que los alumnos consulten el catálogo de la biblioteca, reserven libros (o se anoten en la lista de espera), lean el código de barras con la cámara y reciban un recordatorio para devolverlos. También tiene un mostrador para el personal, que entrega los libros respetando el orden de las reservas.

- **SDK de Expo:** 58 (`expo ~58.0.26`, React Native 0.88, React 19.3, Expo Router 58)
- **Lenguaje:** TypeScript estricto, sin `any`, con rutas tipadas
- **Módulos nativos:** solo `expo-camera` y `expo-notifications`
- Las respuestas de las Partes B a E están en `RESPUESTAS.md`

---

## 🚀 Cómo inicializarlo (paso a paso)

### 1. Lo que necesitás tener instalado

| Qué | Versión | Para qué |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 20 LTS o más nuevo (yo usé 22) | correr Expo y npm |
| Git | cualquiera reciente | clonar el repo |
| **Expo Go** en el celular | la versión que soporte **SDK 58** (actualizala desde Play Store / App Store) | abrir la app en el teléfono |

> El celu y la compu tienen que estar en **la misma red wifi**. Si no se puede (wifi del instituto, por ejemplo), usá el modo túnel del paso 4.

### 2. Bajar el proyecto e instalar dependencias

```bash
git clone <url-de-este-repositorio> biblioteca-ipf
cd biblioteca-ipf
npm install
```

Si te bajaste el `.zip`, descomprimilo, entrá a la carpeta y corré solo `npm install`. El zip ya trae el historial de git (la carpeta `.git`), así que no hace falta clonar nada.

> ⚠️ No instales paquetes nuevos con `npm install <paquete>`: en este proyecto se agregan siempre con `npx expo install <paquete>`, que elige la versión compatible con el SDK.

### 3. Levantar el servidor de desarrollo

```bash
npx expo start
```

Va a aparecer un código QR en la terminal.

- **Android:** abrí Expo Go → "Scan QR code" y escaneá el QR.
- **iPhone:** escaneá el QR con la app de Cámara y tocá el cartel que dice "Abrir en Expo Go".

### 4. Si el celu no encuentra la compu (red distinta, firewall, etc.)

```bash
npx expo start --tunnel
```

La primera vez te puede pedir instalar `@expo/ngrok`: decile que sí.

### 5. Probar el escáner con un libro de verdad

En `src/data/libros.ts`, los **dos primeros libros** son los que uso para probar el escáner. Si tenés otros libros a mano, cambiá el `isbn` por el número de 13 dígitos que figura abajo del código de barras de la contratapa (empieza con 978 o 979). Guardás el archivo y la app se recarga sola.

### 6. Ingresar como personal de la biblioteca

Tocá **"Personal"** arriba a la derecha del Catálogo:

- **Usuario:** `biblioteca`
- **Clave:** `ipf2026`

(Están fijas en `src/constants/biblioteca.ts`, como pide la consigna. En una app real esto nunca iría en el código.)

### 7. Comandos útiles

```bash
npx expo start          # servidor de desarrollo
npx expo start -c       # lo mismo pero limpiando la caché (si algo "no se actualiza")
npx expo lint           # lint (tiene que dar 0 errores)
npx tsc --noEmit        # chequeo de tipos (tiene que dar 0 errores)
npm test                # tests de Pila y Cola con jest-expo
```

> 💡 Las rutas tipadas se generan en `.expo/types` la primera vez que corrés `npx expo start`. Hacelo al menos una vez antes de `npx tsc --noEmit`, así TypeScript chequea también que cada `href` apunte a una ruta que existe.

---

## 🗂️ Árbol de rutas (`src/app`) y navegador de cada `_layout`

```
src/app
├── _layout.tsx                  → Stack RAÍZ (provider del Context, Stack.Protected, anchor: "(tabs)")
│
├── (tabs)/
│   ├── _layout.tsx              → Tabs (import { Tabs } from 'expo-router/js-tabs')
│   │
│   ├── (catalogo)/
│   │   ├── _layout.tsx          → Stack de la tab "Catálogo" (anchor: "index")
│   │   ├── index.tsx            → /                  Catálogo + Vistos recientemente + Buscar/Escanear
│   │   └── libro/
│   │       └── [isbn].tsx       → /libro/[isbn]      Detalle (valida el isbn)
│   │
│   └── reservas.tsx             → /reservas          Tab "Mis reservas"
│
├── buscar.tsx                   → /buscar?q=         Buscador (la búsqueda vive en la URL)
├── escanear.tsx                 → /escanear          Escáner EAN-13 + ingreso manual
├── reservar/
│   └── [isbn].tsx               → /reservar/[isbn]   presentation: "modal"
├── permisos/
│   └── [recurso].tsx            → /permisos/[recurso] presentation: "modal" (camara | notificaciones)
├── login.tsx                    → /login             modal, solo existe SIN sesión (Stack.Protected)
├── mostrador.tsx                → /mostrador         solo existe CON sesión (Stack.Protected)
├── reserva.tsx                  → /reserva           <Redirect href="/reservas" /> (URL vieja)
└── +not-found.tsx               → cualquier otra     404 que muestra la URL inexistente
```

¿Por qué `(tabs)` y `(catalogo)` van entre paréntesis? Son **grupos**: organizan los navegadores pero no aparecen en la URL. Por eso el Catálogo responde en `/` y el detalle en `/libro/[isbn]`, aunque estén dos carpetas más adentro.

### El resto de `src`

```
src
├── app/           solo rutas (lo de arriba)
├── components/    componentes visuales, uno por archivo (Boton, FilaDeLibro, TarjetaDePrestamo…)
├── constants/     tema.ts (colores claro/oscuro, espacios, tamaños), biblioteca.ts (reglas), permisos.ts (textos)
├── context/       BibliotecaContext.tsx (préstamos, colas de espera, recientes, sesión, avisos)
├── data/          libros.ts (16 libros + listas de espera iniciales)
├── estructuras/   Pila.ts y Cola.ts (con #items, tamanio y aArray) + sus tests
├── hooks/         useLibros, useBusqueda, usePermiso, useBiblioteca, useColores, useEstilos
├── lib/           api.ts (de la cátedra), catalogo, fechas, notificaciones, permisos, almacenamiento
└── types/         index.ts (Libro tal cual la consigna + tipos propios)
```

---

## 🔌 Bloque `plugins` de `app.json` (comentado)

El JSON real no admite comentarios, así que acá va explicado línea por línea:

```jsonc
"plugins": [
  // necesario para Expo Router (rutas por archivos y deep links con el scheme "bibliotecaipf")
  "expo-router",

  // la splash queda visible hasta que la app termina de leer lo guardado (así nunca se ve "vacía")
  ["expo-splash-screen", { "backgroundColor": "#1F4E79", "image": "./assets/images/splash-icon.png", "imageWidth": 76 }],

  ["expo-camera", {
    // texto de propósito de iOS (NSCameraUsageDescription), con el molde "Usamos tu [dato] para [beneficio]"
    "cameraPermission": "Usamos tu cámara para leer el código de barras de la contratapa y abrirte la ficha del libro al toque.",
    // mínimo privilegio: no grabamos video, así que NO declaramos micrófono en iOS…
    "microphonePermission": false,
    // …ni RECORD_AUDIO en Android
    "recordAudioAndroid": false,
    // sí necesitamos el lector de códigos de barras (es para lo único que usamos la cámara)
    "barcodeScannerEnabled": true
  }],

  ["expo-notifications", {
    // color del ícono de la notificación en Android
    "color": "#1F4E79",
    // canal por defecto: el mismo "prestamos" que creamos por código antes de pedir el permiso
    "defaultChannel": "prestamos",
    // solo usamos notificaciones LOCALES: apagamos las remotas y así no se agrega el entitlement de push en iOS
    "enableRemoteNotifications": false
  }]
]
```

Además, en `app.json` están `"scheme": "bibliotecaipf"`, `"typedRoutes": true` (rutas tipadas) y `"reactCompiler": true`.

---

## 🔐 Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Si la persona dice que no (alternativa) |
| --- | --- | --- | --- |
| Cámara | `expo-camera` (`useCameraPermissions`, envuelto en `usePermiso`) | Al tocar **"Escanear"**: primero aparece la pantalla previa `/permisos/camara` con el beneficio y el botón "Continuar", y recién ahí el cartel del sistema | Siempre se puede **escribir el ISBN a mano** en el mismo escáner. Si quedó bloqueado, el botón pasa a ser **"Abrir Ajustes"** |
| Notificaciones | `expo-notifications` | **Únicamente** al prender el interruptor **"Recordarme"** de un préstamo (antes se crea el canal `prestamos` en Android y se muestra `/permisos/notificaciones`) | Los avisos aparecen **dentro de la app**, en la pestaña "Mis reservas" (con un numerito en la tab). Nada se bloquea |

La app **no pide ningún otro permiso**: no usa ubicación, galería, micrófono ni contactos.

### ¿Por qué estos `blockedPermissions`?

En `android.blockedPermissions` bloqueamos todo lo que la app **no usa**, por si alguna librería (o una dependencia de una dependencia) lo agrega sin avisar. En el build, Expo los marca con `tools:node="remove"` y desaparecen del `AndroidManifest.xml` final:

| Permiso bloqueado | Por qué no lo necesitamos |
| --- | --- |
| `RECORD_AUDIO` | La cámara solo lee códigos de barras: no grabamos video con sonido. Va además de `recordAudioAndroid: false`, como doble seguro |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` | La biblioteca no necesita saber dónde estás |
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | No leemos ni guardamos fotos ni archivos: lo guardado va en AsyncStorage, que es privado de la app |
| `READ_CONTACTS` | No compartimos nada con contactos |
| `SYSTEM_ALERT_WINDOW` | No dibujamos encima de otras apps (Expo lo puede agregar en desarrollo) |

Lo comprobé con `npx expo config --type introspect`: después de los plugins, la app declara solo `CAMERA`, `INTERNET` y `VIBRATE` (más `POST_NOTIFICATIONS` y `RECEIVE_BOOT_COMPLETED`, que llegan desde el manifest de `expo-notifications` al compilar), y todos los de la tabla aparecen con `tools:node="remove"`. En iOS solo queda `NSCameraUsageDescription` con nuestro texto.

---

## 🔗 Deep links de prueba

En una build propia el scheme es `bibliotecaipf://`. En **Expo Go** hay que usar la URL de Metro con `/--/` adelante de la ruta (reemplazá `192.168.0.10` por la IP que te muestra `npx expo start`):

| Link con scheme | Equivalente en Expo Go | Qué debería pasar |
| --- | --- | --- |
| `bibliotecaipf://libro/9789500725347` | `exp://192.168.0.10:8081/--/libro/9789500725347` | Detalle de "Ficciones", con el Catálogo debajo |
| `bibliotecaipf://libro/123` | `exp://192.168.0.10:8081/--/libro/123` | Mensaje "no parece un ISBN" + botón "Volver al catálogo" |
| `bibliotecaipf://buscar?q=borges` | `exp://192.168.0.10:8081/--/buscar?q=borges` | Buscador con "borges" escrito y sus resultados, con las tabs debajo |
| `bibliotecaipf://mostrador` (sin sesión) | `exp://192.168.0.10:8081/--/mostrador` | No existe sin sesión: termina en el Catálogo |
| `bibliotecaipf://reserva` | `exp://192.168.0.10:8081/--/reserva` | Redirige a "Mis reservas" |
| `bibliotecaipf://escanear` | `exp://192.168.0.10:8081/--/escanear` | Escáner (o el cartel de "bloqueado" + ingreso manual) |
| `bibliotecaipf://cualquier/cosa` | `exp://192.168.0.10:8081/--/cualquier/cosa` | 404 que muestra `/cualquier/cosa` |

**Cómo abrirlos:**

- **Android (con el celu conectado por USB):**

  ```bash
  adb shell am start -a android.intent.action.VIEW -d "exp://192.168.0.10:8081/--/libro/9789500725347"
  ```
- **iPhone o Android sin cable:** pegá el link en una nota o mandatelo por WhatsApp y tocalo.
- **Emulador o simulador:** `npx uri-scheme open "exp://192.168.0.10:8081/--/buscar?q=borges" --android` (o `--ios`).

---

## ✅ Salida de lint y de tipos

```text
$ npx expo lint
(sin salida: 0 errores, 0 advertencias)

$ npx tsc --noEmit
(sin salida: 0 errores)

$ npm test
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

Tampoco hay `console.log`, `any`, estilos en línea ni reglas de lint desactivadas (`eslint-disable`) en todo `src`.

---

## ⭐ Desafíos opcionales que hice

- **Persistencia:** préstamos (con el id de cada notificación), vistos recientes, listas de espera y avisos se guardan con `@react-native-async-storage/async-storage`. La splash queda arriba hasta terminar de leer, así que la app nunca se ve vacía al arrancar. Además, al abrir se limpian los ids de recordatorios que ya sonaron con la app cerrada.
- **Pruebas:** 12 tests de `Pila` y `Cola` con `jest-expo` (incluye desencolar una cola vacía y desapilar una pila vacía).
- **Debounce:** el buscador espera 300 ms sin escribir antes de llamar a `buscarLibros`, y la limpieza corta el temporizador.
- **Modo oscuro:** con `useColorScheme` y las dos paletas de `tema.ts`. Los headers y la barra de tabs también cambian, porque le paso la paleta al `ThemeProvider` de navegación.

---

## 📸 Capturas para la entrega (capturas/)

Van en la carpeta `capturas/` 
