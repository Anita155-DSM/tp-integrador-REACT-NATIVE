# Respuestas — TP N° 4 "Biblioteca IPF"

Todas las referencias son a archivos de este repo, con el formato `archivo:línea`. Cuando el fragmento importa, lo pego.

Algunas cosas de navegación (las pilas de C1, C2 y C3) no las quise contestar "de memoria". Armé un test temporal con `expo-router/testing-library`, que monta la app entera y deja imprimir el estado real del navegador después de cada paso. Las pilas que aparecen abajo salen de ahí. El test lo borré antes de entregar, porque la consigna pide no dejar archivos sin usar. Las preguntas que piden comprobar algo en el teléfono las hice en Expo Go.

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

El hook está en `src/hooks/useLibros.ts`:

```ts
const [libros, setLibros] = useState<Libro[]>([]);             // l.16
const [cargando, setCargando] = useState(true);                 // l.17
const [error, setError] = useState<string | null>(null);        // l.18
const [numeroDeIntento, setNumeroDeIntento] = useState(0);      // l.20

useEffect(() => {                                               // l.22
  let sigueEnPantalla = true;
  obtenerLibros()
    .then((librosQueLlegaron) => { if (sigueEnPantalla) { setLibros(librosQueLlegaron); setCargando(false); } })
    .catch(() => { if (sigueEnPantalla) { setError(MENSAJE_SI_FALLA); setCargando(false); } });
  return () => { sigueEnPantalla = false; };                    // l.40-42
}, [numeroDeIntento]);                                          // l.43

const reintentar = useCallback(() => {                          // l.46
  setCargando(true);
  setError(null);
  setNumeroDeIntento((intentoAnterior) => intentoAnterior + 1);
}, []);
```

**a) Render por render**

*Cuando todo sale bien:*

| Render | Qué lo provoca | `libros` | `cargando` | `error` | Qué se ve |
|---|---|---|---|---|---|
| 1 | Se monta el Catálogo | `[]` | `true` | `null` | El indicador "Trayendo los libros…" (`index.tsx:21-22`) |
| — | Después de pintar corre el efecto y llama a `obtenerLibros()`. **No** hay `setState` directo en el efecto, así que no se genera otro render | | | | |
| 2 | A los ~800 ms llega la respuesta. `setLibros` y `setCargando(false)` se agrupan en **un solo** render (React 18+ agrupa los `setState` aunque estén adentro de un `.then`) | 16 libros | `false` | `null` | La lista |

Son **2 renders propios del hook**. En mi app aparece alguno más, que no viene de `useLibros` sino del Context: el Catálogo usa `useBiblioteca()`, y cuando el proveedor termina de leer AsyncStorage al arrancar, cambia su `value` y el Catálogo se vuelve a renderizar. En esos renders los tres valores del hook siguen igual.

*Cuando `obtenerLibros()` falla y la persona toca "Reintentar":*

| Render | Qué lo provoca | `libros` | `cargando` | `error` | Qué se ve |
|---|---|---|---|---|---|
| 1 | Montaje | `[]` | `true` | `null` | Indicador de carga |
| 2 | A los 800 ms el `.catch` hace `setError(...)` y `setCargando(false)`, agrupados | `[]` | `false` | `"No pudimos conectarnos…"` | `EstadoError` con el botón "Reintentar" (`index.tsx:23-24`) |
| 3 | Toque en "Reintentar": `reintentar()` hace 3 `setState` en el mismo evento → un solo render | `[]` | `true` | `null` | Indicador de carga otra vez |
| — | Como cambió `numeroDeIntento`, React corre **primero la limpieza del efecto anterior** (pone su `sigueEnPantalla` en `false`, que ya no importa porque ese pedido terminó) y **después el efecto nuevo**, que vuelve a pedir | | | | |
| 4 | A los 800 ms llega la respuesta nueva | 16 libros (o `[]` si volvió a fallar) | `false` | `null` (o el mensaje) | La lista (o el error de nuevo) |

Un detalle: el `setCargando(true)` lo puse en `reintentar` (el evento) y no adentro del efecto. Si lo hacía en el efecto, iba a haber un render extra al pedo (y el lint de React lo marca: `set-state-in-effect`). Además, en el primer montaje no hace falta, porque `cargando` ya arranca en `true`.

**b) ¿Se desmonta el Catálogo?**

Lo probé con un `console.log('limpieza de useLibros')` temporal adentro del `return () => {...}` (después lo saqué):

- **Al cambiar a la pestaña "Mis reservas": no se desmonta.** No aparece el log. Las tabs dejan montadas las pantallas que ya visitaste, solo las ocultan. Si volvés, la lista está tal cual y no se vuelve a pedir nada.
- **Al abrir un detalle: tampoco.** El detalle se apila **encima** en el Stack de la tab Catálogo, y el `index` queda montado abajo (por eso al volver la lista aparece al instante, con el scroll donde lo dejaste).

¿Cuándo corre entonces mi limpieza en la vida real?

1. **Cada vez que se reintenta.** Antes de correr el efecto nuevo, React limpia el anterior. Es el caso más común.
2. **Cuando la pantalla se desmonta de verdad**: si se cierra la app, si se recarga en desarrollo (Fast Refresh), o en modo estricto de desarrollo (que monta, desmonta y vuelve a montar a propósito).
3. **Si la respuesta tarda y la pantalla se va antes.** En mi árbol el Catálogo es la base de su pila y casi nunca se va. Pero el mismo hook podría usarse en otra pantalla, y ahí la bandera evita hacer `setState` sobre algo que ya no está.

O sea: hoy la limpieza "trabaja" poco, pero es la que garantiza que una respuesta vieja nunca pise el estado.

**c) ¿Por qué no se puede pasar una función `async` a `useEffect`?**

Porque `useEffect` espera que la función devuelva **nada o una función de limpieza**. Una función `async` siempre devuelve una **Promesa**. React tomaría esa promesa como si fuera la limpieza: no puede ejecutarla, tira una advertencia, y además te quedás sin forma de limpiar.

Lo resolví de dos maneras, según el caso:

- En `useLibros.ts:22-43` el efecto es una función normal y uso `.then/.catch`.
- En el Context (`BibliotecaContext.tsx:90-118`), donde encadeno dos `await`, declaro una función `async` **adentro** del efecto y la llamo, y el efecto devuelve la limpieza sincrónica:

```ts
useEffect(() => {
  let sigueMontado = true;
  async function recuperarLoGuardado() { /* await leerEstadoGuardado(); await obtenerIdsTodaviaProgramados(); ... */ }
  recuperarLoGuardado();
  return () => { sigueMontado = false; };
}, []);
```

**d) ¿Cómo funciona `reintentar`?**

El efecto depende de `numeroDeIntento` (`useLibros.ts:43`). `reintentar` hace `setNumeroDeIntento(n => n + 1)`. Ese número cambió, así que en el render siguiente React ve una dependencia distinta, limpia el efecto anterior y lo vuelve a correr. Eso es lo que relanza el pedido.

¿Por qué un contador y no otra cosa?

- Un **contador** siempre da un valor nuevo. Un booleano que va y viene (`true → false → true`) podría caer en el mismo valor si se agrupan dos cambios, y entonces el efecto no correría.
- No podía usar `libros` ni `error` como dependencia, porque **los cambia el propio efecto**: se armaría un bucle de pedidos.
- Funciona como un "ticket de recarga": no significa nada por sí mismo, solo avisa que hay que pedir de nuevo.

### B2. La condición de carrera del buscador

El buscador es `src/app/buscar.tsx`, y la lógica está en `src/hooks/useBusqueda.ts:24-52`. Tiene **debounce de 300 ms** y **bandera de descarte**:

```ts
useEffect(() => {
  if (textoLimpio === '') return;
  let esLaUltimaBusqueda = true;                         // l.30
  const temporizador = setTimeout(() => {                // l.33
    buscarLibros(textoLimpio).then((librosEncontrados) => {
      if (esLaUltimaBusqueda) setUltimaRespuesta({ resultados: librosEncontrados, error: null, textoBuscado: textoLimpio });
    });
  }, DEMORA_DEL_BUSCADOR_MS);
  return () => {
    esLaUltimaBusqueda = false;                          // l.49
    clearTimeout(temporizador);                          // l.50
  };
}, [textoLimpio]);
```

Además guardo **para qué texto** es cada respuesta (`textoBuscado`). Si no coincide con lo que dice la URL ahora, el hook devuelve `buscando: true` y una lista vacía (`useBusqueda.ts:55-61`), así que nunca se ven resultados de otra búsqueda.

| Momento | Qué pasa | Sin limpieza: qué se ve | Con mi código: qué se ve |
|---|---|---|---|
| t = 0 ms | Escribe "bor" → se pide `buscarLibros("bor")` (1.400 ms) | "Buscando…" | "Buscando…". Ojo: con el debounce, **"bor" todavía no se pidió**; se pediría a los 300 ms |
| t = 200 ms | Escribe "borges" → se pide `buscarLibros("borges")` (300 ms) | "Buscando…" | "Buscando…". La limpieza **cancela el temporizador de "bor"** (nunca sale) y arranca uno nuevo para "borges", que se pide a los 500 ms |
| t = 500 ms | Llega la respuesta de "borges" | Los 3 libros de Borges | En mi app recién **se pide** "borges" a los 500 ms, y llega a los 800 ms. Ahí se ven los 3 libros de Borges |
| t = 1.400 ms | Llega la respuesta de "bor" | **Bug:** se pisan los resultados con los de "bor", mientras el campo dice "borges" | Nada cambia: siguen los de Borges. "bor" ni siquiera se pidió. Y si la persona escribe más lento y "bor" sale igual, su respuesta llega con `esLaUltimaBusqueda = false` y se descarta |

Eso último lo probé con un test temporal con timers falsos: hice que "bor" llegue a los 1.400 ms y "borges" a los 300 ms. Aun pidiendo los dos, en pantalla quedó siempre "resultado de borges".

**a) ¿Qué hace la limpieza y cuándo corre?**

Cada vez que corre el efecto se crea una variable `esLaUltimaBusqueda` **nueva**, que queda atrapada en la clausura del `.then` de **esa** búsqueda. La limpieza hace dos cosas:

1. `clearTimeout(temporizador)`: si todavía no se llamó a la API (estamos en los 300 ms de espera), la llamada no sale.
2. `esLaUltimaBusqueda = false`: si la llamada ya salió, cuando vuelva su `.then` va a ver `false` y no va a tocar el estado.

Corre **justo antes de volver a ejecutar el efecto**, o sea, cuando cambia `textoLimpio` (la persona escribió otra letra), y también si la pantalla se desmonta (la persona salió del buscador con la búsqueda en vuelo).

**b) La propuesta del compañero: `if (texto === q) setResultados(datos)`**

**No funciona.** El `.then` es una función creada **en el render en que corrió el efecto**, así que "ve" el `q` de **ese** render, no el actual. En JavaScript, una clausura captura las variables del momento en que se creó, y cada render de React tiene sus propias constantes `q`. Entonces, cuando llega la respuesta de "bor", su `.then` compara `"bor" === "bor"` (el `q` viejo con el texto viejo) y **da `true` siempre**. La respuesta vieja pasa igual y pisa la nueva.

Para que esa idea funcione habría que comparar con el valor **más reciente**, por ejemplo guardándolo en un `useRef` que se actualice en cada render (`ultimoQ.current = q`) y comparando `texto === ultimoQ.current`. Funciona, pero la bandera de la limpieza es más simple y además corta el temporizador.

**c) ¿Qué pasa con la URL y con el botón atrás?**

Uso `router.setParams({ q: textoNuevo })` (`buscar.tsx:24`). La URL va cambiando sola (`/buscar?q=b`, `/buscar?q=bo`, … `/buscar?q=borges`), pero **es la misma pantalla con otros parámetros**: no se agrega nada al historial. Si tocás atrás, salís del buscador y volvés al Catálogo de una. En el test se ve: después de escribir, la raíz sigue siendo `[(tabs), buscar]`.

Con `router.push` cada letra sería **una pantalla nueva apilada**: para salir de "borges" tendrías que tocar atrás 6 veces (una por letra). Además, cada push monta un buscador nuevo, con su propio efecto y su propio pedido: más renders, más pedidos y el teclado que se cierra y se abre.

### B3. Mutar o reemplazar

**a) Toca "Anotarme" tres veces: ¿qué muestra?**

Sigue mostrando **"Personas en espera: 0"**. `encolar` modifica el objeto que está guardado en el estado, pero no llama a ningún `setState`. React no se entera de que algo cambió, así que no vuelve a renderizar. Por dentro la cola ya tiene 3 personas; la pantalla, no.

**b) ¿Por qué después "salta" a 3?**

Al escribir en el `TextInput` controlado se hace un `setState` (el del texto) y la pantalla se vuelve a renderizar entera. En ese render, `espera.tamanio` se lee de nuevo y ahora vale 3. El número "salta" por un motivo que no tiene nada que ver con la cola.

Un error que aparece "a veces" es peor que uno que aparece siempre, porque:

- depende de algo ajeno (que otro estado cambie), así que **no lo podés reproducir a voluntad**;
- puede no aparecer cuando probás, y sí cuando lo usa otra persona;
- te hace sospechar de lo que no es (del `TextInput`, del teclado…);
- cualquier cambio en otra parte del componente lo puede hacer aparecer o esconderse.

Uno que aparece siempre lo ves en la primera prueba y lo arreglás.

**c) Cómo lo resolví y alternativas**

En el Context **nunca muto** una `Cola` ni la `Pila` que está en el estado: armo una **copia**, la modifico y guardo la copia. Para eso les agregué `clonar()` a las dos clases (`Cola.ts`, `Pila.ts`). Por ejemplo, al anotarme en la lista de espera (`BibliotecaContext.tsx:197-205`):

```ts
setListasDeEspera((listasAnteriores) => {
  const colaVieja = listasAnteriores[isbn] ?? new Cola<string>();
  if (colaVieja.aArray().includes(MI_NOMBRE_EN_LA_LISTA)) return listasAnteriores;
  const colaNueva = colaVieja.clonar();
  colaNueva.encolar(MI_NOMBRE_EN_LA_LISTA);
  return { ...listasAnteriores, [isbn]: colaNueva };   // objeto nuevo y cola nueva → React se entera
});
```

Lo mismo para desencolar en el mostrador (`:270-274`) y para apilar recientes (`:146-155`).

| Alternativa | Ventaja | Costo |
|---|---|---|
| **Copiar la cola y reemplazarla** (lo mío) | React compara por referencia y se entera siempre. Funciona con `useMemo`, con `memo` y con las dependencias de los efectos. No hay forma de "olvidarse" de avisar | Copia toda la cola en cada operación (O(n)). Se pierde un poco la gracia de la cola con punteros, aunque con 2 o 3 personas no se nota nada. Y hay que acordarse de no mutar nunca la que está en el estado |
| **Contador de versión** (mismo objeto + `setVersion(v => v + 1)`) | Barato: no copia nada | El objeto sigue siendo el mismo, así que todo lo que dependa de la cola (`useMemo([cola])`, `memo`) **no se entera**. Si te olvidás un `setVersion`, volvés al bug de B3a. Y mutar durante el render es peligroso en modo estricto |
| **`useReducer`** con acciones `encolar`/`desencolar` | Todas las transiciones quedan en un solo lugar, fáciles de testear y de leer | Más código, y el reducer **igual tiene que devolver objetos nuevos**: no te salva de copiar, solo lo ordena |

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
|---|---|---|
| Texto del buscador | **URL** (`/buscar?q=`), se lee con `useLocalSearchParams` (`buscar.tsx:18`) | Así un deep link como `bibliotecaipf://buscar?q=borges` abre la búsqueda hecha, y no duplico el dato en un `useState`. Si estuviera en estado local, se perdería al salir y no se podría compartir |
| Préstamos y reservas | **Context** (`prestamos`), guardado en AsyncStorage. Las reservas *en espera* no se guardan: **se calculan** desde las colas (`reservasEnEspera`, `BibliotecaContext.tsx:318-328`) | Los usan varias pantallas (detalle, confirmación, Mis reservas, mostrador). Si cada una tuviera su copia se desincronizarían. Las esperas son un dato derivado: guardarlas aparte sería tener la misma información en dos lugares |
| Listas de espera | **Context**, un `Record<isbn, Cola<string>>` | Las leen el detalle ("cuántos esperan"), la confirmación (en qué puesto quedarías), Mis reservas (tu posición) y el mostrador (quién está al frente). Tienen que ser una sola fuente |
| Vistos recientemente | **Context** (una `Pila<Libro>`), guardada en AsyncStorage. Los 3 que se muestran **se calculan** con `useMemo` | Se escribe desde el detalle y se lee desde el Catálogo, que son pantallas distintas. Con estado local del Catálogo, el detalle no podría apilar |
| Sesión del personal | **Context** (`sesionIniciada`), a propósito **sin** guardar en el teléfono | La necesita el layout raíz para el `Stack.Protected` y el link del header. No la persisto por seguridad: si cerrás la app, hay que volver a entrar |
| Ejemplares disponibles de un libro | **Se calcula**: `calcularEjemplaresDisponibles(libro, prestamos)` (`catalogo.ts:27`) | Sale de dos datos que ya tengo (los ejemplares iniciales y mis préstamos del estante). Si lo guardara aparte, tendría dos fuentes que se pueden contradecir (ver E4 d) |
| Estado del permiso de cámara | **Sistema operativo** (es la verdad). La app tiene una copia en el estado de `useCameraPermissions`, que se refresca con el foco y al volver a primer plano (`usePermiso.ts:47-61`) | La persona lo puede cambiar desde Ajustes sin pasar por la app, así que no tiene sentido guardarlo como dato propio: hay que preguntarle al sistema |
| Identificador de la notificación programada | **Context**, adentro de cada `Prestamo` (`idDeLaNotificacion`), guardado en AsyncStorage. La notificación en sí vive en el **sistema operativo** | Está pegado al préstamo: si lo devolvés o apagás "Recordarme", tengo el id a mano para cancelarla. Lo persisto porque, si la app se cierra, sin el id no podría cancelar nada |

**¿Qué se re-renderiza cuando cambia el `value` del Context?**

**Todos los componentes que llaman a `useBiblioteca()`**, usen o no la parte que cambió. El `value` es un solo objeto (`BibliotecaContext.tsx:330`). Si cambia `prestamos`, se arma un objeto nuevo y React avisa a todos los consumidores.

Entonces sí: el Catálogo, que solo usa `ultimosVistos`, **se re-renderiza cuando activás un recordatorio en "Mis reservas"**, porque eso cambia `prestamos`. Pasa aunque la pestaña esté oculta, porque sigue montada. También el `EnlacePersonal` del header y el layout de las tabs (que usa `avisos` para el numerito).

¿Qué se podría hacer?

- **Partir el Context** en varios más chicos (`RecientesContext`, `PrestamosContext`, `SesionContext`) para que cada pantalla escuche solo lo suyo.
- Usar **selectores** (por ejemplo `use-context-selector`) para suscribirse a una parte.
- Envolver las filas en `memo`. Ojo: eso evita re-renderizar las filas, pero no la pantalla.

**¿Vale la pena acá? No.** Son 16 libros y un par de pantallas; un render de más no se nota. Además tengo el React Compiler prendido (`app.json`), que ya memoriza mucho por su cuenta. Lo haría recién si con el Profiler de React DevTools viera un problema real.

---

## Parte C · Navegación y rutas

### C1. La pila en tu app

Notación: **Raíz** es el Stack de `src/app/_layout.tsx`. **Catálogo** es el Stack de `src/app/(tabs)/(catalogo)/_layout.tsx`. La pantalla visible está en **negrita**.

| # | Acción | Pilas resultantes (de base a tope) |
|---|---|---|
| 1 | Abre la app | Raíz: `[(tabs)]` · Tabs en "Catálogo" · Catálogo: `[`**`index`**`]` |
| 2 | Toca un libro del Catálogo | Raíz: `[(tabs)]` · Catálogo: `[index, `**`libro/9789500725347`**`]` |
| 3 | Toca "Reservar" | Raíz: `[(tabs), `**`reservar/9789500725347`**` (modal)]` · Catálogo (abajo, sin cambios): `[index, libro/9789500725347]` |
| 4 | Toca "Confirmar" | Raíz: `[(tabs)]` (el modal **ya no está**) · Tabs en "Mis reservas" (**`reservas`**) · Catálogo (oculto): `[index, libro/9789500725347]` |
| 5 | Toca atrás (Android) | Raíz: `[(tabs)]` · Tabs vuelve a "Catálogo" · Catálogo: `[index, `**`libro/9789500725347`**`]`. Se ve el **detalle**, no la confirmación |
| 6 | Toca la tab "Catálogo" | Raíz: `[(tabs)]` · Catálogo: `[`**`index`**`]` (vuelve al principio de su pila) |

**a) ¿Qué método usé en el paso 4?**

`router.dismissTo('/reservas')` (`reservar/[isbn].tsx:27`). Cierra el modal haciendo pop en la pila raíz hasta llegar a `(tabs)`, y adentro navega a la pestaña `reservas`.

- **Con `push`:** apila una pantalla nueva **encima del modal**. En la raíz quedaría `[(tabs), reservar, (tabs)]`, y al tocar atrás **volverías a la confirmación**, justo lo que la consigna pide evitar (además podrías confirmar dos veces).
- **Con `replace`:** saca el modal, pero lo reemplaza por **otra copia de las tabs**: `[(tabs), (tabs)]`. No vuelve a la confirmación, pero tenés dos catálogos apilados. Al tocar atrás no salís, pasás a la copia vieja, y parece que la app "no hace caso". Esto lo vi en el test de navegación (con el escáner, que es el mismo caso: desde la raíz hacia una ruta adentro de las tabs).
- **Con `dismissTo`:** cierra lo que está encima hasta encontrar `(tabs)` y adentro va a `reservas`. Queda una sola copia de las tabs y la confirmación desaparece del historial. Por eso lo elegí.

**b) En el paso 6, ¿qué pantalla ve la persona?**

Ve **el Catálogo** (`index`), no el detalle. Después del paso 5 la persona ya estaba en la tab Catálogo mirando el detalle. En las tabs, **tocar la pestaña que ya está activa hace "pop to top"** de su pila. Si en vez de tocar atrás hubiera tocado la tab "Catálogo" directamente desde "Mis reservas", habría visto **el detalle**, porque cada tab conserva su pila.

¿Me parece correcto? **Sí.** Es el comportamiento estándar de iOS y Android (Instagram, WhatsApp), así que la gente ya lo conoce, y conservar la pila sirve para volver a donde estabas. Si quisiera que el Catálogo siempre vuelva al principio al salir de la pestaña, se puede activar `popToTopOnBlur` en esa tab. No lo hice, porque perder el detalle que estabas mirando me parece peor.

### C2. El escáner que dispara de más

**a) ¿Qué pasaría con `router.push` sin protección?**

`onBarcodeScanned` se llama muchas veces por segundo mientras el código sigue frente a la cámara. Cada llamado haría un `router.push`, y cada push **se encola** en la cola de acciones de navegación (lo que vimos en el TP 2). Esa cola se procesa en orden, así que **no se descartan los repetidos**: se ejecutan todos. Resultado: 5, 10 o 20 detalles del mismo libro apilados, una animación tras otra, y para volver hay que tocar atrás 20 veces. De yapa, el libro se intentaría apilar en "vistos recientes" en cada detalle (aunque mi Pila no lo duplica si ya está en el tope).

**b) ¿`useState` o `useRef`?**

`useRef` (`escanear.tsx:21`, se chequea en `:26` y se prende en `:37`).

Un `useState(true)` puesto en el primer escaneo **no alcanza**:

- `setState` **no cambia el valor en el momento**: agenda un render. Hasta que ese render ocurra, la variable que lee el callback sigue valiendo `false`.
- Los siguientes `onBarcodeScanned` llegan **antes** de ese render (vienen de la cámara nativa, muy rápido) y usan la función de la clausura vieja, que ve `false`. Pasan todos el `if` y navegan.

El `ref.current = true` cambia **ya**, es el mismo objeto en todos los renders y no necesita un render para que el siguiente llamado lo vea.

**c) ¿Por qué conviene `replace` para ir del escáner al detalle?**

La idea es que **el escáner no quede en el historial**. Con `push`, al tocar atrás desde el detalle volverías a la cámara prendida, que podría leer el mismo código otra vez y mandarte de nuevo al detalle: un ida y vuelta molesto. Además la cámara seguiría ocupada de fondo.

En **mi** árbol hice algo distinto, y lo probé. El escáner está en la pila raíz y el detalle adentro de `(tabs)/(catalogo)`. Un `replace` desde la raíz cambia el escáner por **otra copia entera de las tabs**: la raíz queda `[(tabs), (tabs) → [libro]]`, y esa copia nueva ni siquiera tiene el Catálogo debajo. Por eso usé `router.dismissTo({ pathname: '/libro/[isbn]', params: { isbn } })` (`escanear.tsx:39`), que logra lo mismo que se busca con `replace`:

| Método | Raíz después de leer el código | Al tocar atrás |
|---|---|---|
| `push` | `[(tabs), escanear, (tabs)→libro]` | Vuelve **al escáner** |
| `replace` | `[(tabs), (tabs)→libro]` (tabs duplicadas) | Va a la copia vieja de las tabs |
| `dismissTo` (el mío) | `[(tabs)]`, con Catálogo: `[index, libro]` | Vuelve **al Catálogo** ✔ |

**d) Si el ISBN leído no está en el catálogo**

Muestra un cartel amarillo: *"El código 978… no está en nuestro catálogo. Probá con otro libro: la cámara sigue escaneando."* (`escanear.tsx:85-90`). La cámara no se apaga, así que podés probar con otro libro, o escribirlo a mano abajo.

Para que el aviso no aparezca diez veces seguidas guardo el último código desconocido en otro `useRef` (`escanear.tsx:22`). Solo hago `setCodigoDesconocido` si el código es **distinto** al anterior (`:31-33`). Mientras el mismo código siga frente a la cámara, los llamados se ignoran y no hay renders de más. Si apuntás a otro libro desconocido, el aviso se actualiza con el número nuevo.

### C3. Deep links y rutas protegidas

Lo probé con `exp://<IP>:8081/--/…` en Expo Go y lo confirmé con el test de navegación (que imprime las pilas).

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de mi código lo decide |
|---|---|---|---|
| `bibliotecaipf://libro/9789500725347` | El detalle de "Ficciones" | En la pila del Catálogo, el `index` (así "atrás" va al Catálogo y no cierra la app). En la raíz, `(tabs)` | `unstable_settings = { anchor: 'index' }` en `(catalogo)/_layout.tsx:6-8` y `anchor: '(tabs)'` en `_layout.tsx:17-19` |
| `bibliotecaipf://libro/123` | La pantalla de detalle con *"“123” no parece un ISBN: tiene que tener 13 números"* y el botón "Volver al catálogo" | Igual que el anterior: `index` del Catálogo debajo | La validación de la pantalla: `esIsbnValido` (`catalogo.ts:15`) y el `if (!libro)` de `libro/[isbn].tsx:28-39` |
| `bibliotecaipf://buscar?q=borges` | El buscador con "borges" ya escrito y los 3 libros de Borges | `(tabs)` con el Catálogo, gracias al anchor. Atrás → Catálogo | `anchor: '(tabs)'` (`_layout.tsx:18`) y `useLocalSearchParams` (`buscar.tsx:18`) |
| `bibliotecaipf://mostrador` (sin sesión) | El **Catálogo**: el mostrador no existe sin sesión | Una cosa rara que encontré: quedan **dos copias de las tabs** (`[(tabs), (tabs)]`). Expo Router llena el lugar de la ruta protegida con la ruta inicial, encima de la que puso el anchor. La primera vez que tocás atrás parece no hacer nada | `<Stack.Protected guard={sesionIniciada}>` en `_layout.tsx` |
| `bibliotecaipf://reserva` | La pestaña "Mis reservas" | Las tabs con el Catálogo (anchor), y encima otra copia de las tabs en "Mis reservas". Pasa porque `<Redirect>` hace un `replace` desde la pila raíz (el mismo efecto que vi en C2 c) | `<Redirect href="/reservas" />` en `src/app/reserva.tsx` |
| `bibliotecaipf://escanear` (cámara bloqueada) | El escáner con el cartel *"La cámara está bloqueada…"*, el botón "Abrir Ajustes" y el ingreso manual del ISBN. Nunca una pantalla vacía | `(tabs)` con el Catálogo (anchor) | `traducirRespuestaDelPermiso` (`permisos.ts:17`, mira `canAskAgain`) y la rama `bloqueado` de `escanear.tsx:73-80` |

**¿Por qué `/libro/123` llega a mi pantalla de detalle aunque no exista ese libro?**

Porque el router elige la pantalla **por la forma de la URL, no por los datos**. `[isbn]` es un segmento dinámico: matchea **cualquier** texto en esa posición (`123`, `abc`, `hola`). El router no sabe qué es un ISBN, ni conoce mi catálogo, y está bien que no lo sepa.

La responsabilidad de responder bien es **de la pantalla** (con la ayuda de `lib/catalogo.ts`). Tiene que validar el parámetro y, si no sirve, mostrar un mensaje claro con una salida. No puede romperse ni quedar en blanco. Por eso distingo dos casos: "eso no es un ISBN" y "es un ISBN pero no lo tenemos".

### C4. Foco, montaje y primer plano

**a) ¿Qué evento detecta cada herramienta?**

- **`useEffect` con `[]`:** el **montaje**, cuando el componente aparece por primera vez. No se vuelve a ejecutar mientras siga montado.
- **`useFocusEffect`:** cuando la pantalla **gana el foco dentro de la navegación**: volvés a su pestaña, o se cierra una pantalla o un modal que estaba encima. No sabe nada de si la app está en primer plano.
- **`AppState`:** cuando **la app entera** cambia de estado (`active` / `background` / `inactive`). Por ejemplo, salir a Ajustes y volver, o bloquear el teléfono.

**b) ¿Quién se entera en cada caso?**

- **Sale a Ajustes, habilita las notificaciones y vuelve:** solo **`AppState`** (pasa a `active`). La pantalla nunca perdió el foco dentro de la navegación (`useFocusEffect` no corre) y nunca se desmontó (`useEffect []` tampoco).
- **Va a la pestaña Catálogo y vuelve a "Mis reservas":** solo **`useFocusEffect`**. La app nunca salió de primer plano y la pantalla siguió montada (las tabs no desmontan).

**c) ¿Cuál usé y por qué?**

Usé las **dos** adentro de `usePermiso` (`usePermiso.ts:47-61`), más la consulta inicial al montar:

- `useFocusEffect`: para que el escáner se entere al cerrarse el modal `/permisos/camara`, y para que "Mis reservas" se actualice al volver a la pestaña.
- `AppState`: para la vuelta desde Ajustes (paso 6 de D1).

Aun así, hay un caso en que se puede ver un estado viejo: en **pantalla dividida** (multi-ventana de Android), con la app de un lado y Ajustes del otro. Si cambiás el permiso ahí, mi app **nunca deja de estar `active`** ni pierde el foco, así que ninguna de las dos se entera, y el cartel de "Mis reservas" sigue diciendo "bloqueadas" hasta que cambies de pestaña. No se rompe nada: cuando prendés "Recordarme" consulto el permiso en ese momento (`tengoPermisoDeNotificaciones`), así que lo que se hace siempre usa el valor real.

---

## Parte D · Permisos en tu app

### D1. Recorrido completo de la cámara (Android 14, app recién instalada)

En mi app, al tocar "Escanear" (`AccesosRapidos.tsx:13-19`) se abre el escáner y, si no hay permiso, encima aparece el modal `/permisos/camara`. El cartel del sistema recién aparece después de tocar "Continuar".

| # | Acción | Qué muestra mi app | `status` | `canAskAgain` |
|---|---|---|---|---|
| 1 | Toca "Escanear" por primera vez | El modal con el ícono de la cámara, la frase *"Usamos tu cámara para leer el código de barras…"* y **"Continuar"** | `undetermined` | `true` |
| 2 | "Continuar" → "No permitir" | Se cierra el modal. El escáner muestra el cartel con el beneficio, el botón "Usar la cámara" y el ingreso manual del ISBN | `denied` | `true` |
| 3 | Toca "Escanear" otra vez | El mismo modal con "Continuar" (todavía se puede preguntar) | `denied` | `true` |
| 4 | "Continuar" → "No permitir" | Se cierra el modal. Android ya no va a volver a preguntar (dos "no" seguidos = bloqueado), así que el escáner muestra *"La cámara está bloqueada…"*, el botón **"Abrir Ajustes"** y el ingreso manual | `denied` | `false` |
| 5 | Toca "Escanear" otra vez | El modal, pero con el texto de bloqueado y un único botón **"Abrir Ajustes"** | `denied` | `false` |
| 6 | "Abrir Ajustes" → habilita la cámara → vuelve | Al volver, el modal cambia solo a *"Listo, seguir"*. Al cerrarlo, el escáner ya muestra **la cámara** | `granted` | `true` |

**a) En iOS**

Cambia en el **paso 2**. En iOS el cartel del sistema aparece **una sola vez**: el primer "No permitir" ya deja `canAskAgain: false`. Entonces:

- Paso 2: el escáner ya muestra el estado **bloqueado** ("Abrir Ajustes" + ingreso manual).
- Paso 3: el modal aparece directamente con "Abrir Ajustes".
- Pasos 4 y 5 son iguales al 3: no hay un segundo cartel.
- Paso 6: iOS **cierra la app** cuando cambiás un permiso de privacidad en Ajustes. Al volver, la app arranca de cero (la splash, después el Catálogo). Los préstamos y recientes se recuperan de AsyncStorage, y como `usePermiso` consulta al montar, el escáner ya arranca con la cámara.

**b) La línea que decide entre "Continuar" y "Abrir Ajustes"**

```ts
return respuesta.canAskAgain ? 'preguntable' : 'bloqueado';   // src/lib/permisos.ts:17
```

y en la pantalla previa:

```ts
if (estado === 'bloqueado') {                                  // src/components/ExplicacionDelPermiso.tsx:31
  botonQueCorresponde = <Boton texto="Abrir Ajustes" ... alTocar={abrirAjustes} />;
```

Usa **`canAskAgain`**. Con `status` no alcanza porque **los pasos 2 y 4 devuelven el mismo `status: 'denied'`**, pero significan cosas distintas: en el 2 el sistema todavía muestra el cartel si volvés a pedir; en el 4 ya no lo muestra nunca más. Si mirara solo `status`, en el paso 5 mostraría "Continuar", la persona lo tocaría, `requestPermissionsAsync` volvería al instante con `denied` sin mostrar nada, y la persona sentiría que el botón "no anda".

**c) En el paso 6, ¿quién se entera de que volvió de Ajustes?**

El listener de **`AppState`** de `usePermiso.ts:55-60`. Cuando la app vuelve a `active`, llama a `volverAConsultar()`, que vuelve a preguntarle el estado al sistema. Lo tienen montado tanto el modal como el escáner de abajo, así que los dos se actualizan.

Sin esa parte, la app seguiría mostrando **"Abrir Ajustes" aunque la cámara ya esté permitida**. La persona volvería, vería lo mismo y pensaría que no funcionó. Recién se actualizaría al cerrar el modal (por el `useFocusEffect`) o al salir y volver a entrar.

### D2. Notificaciones y consistencia

**a) Activa "Recordarme" y antes de los 15 s toca "Devolver": ¿y si no cancelara?**

A los 15 segundos le llegaría *"Acordate de devolver el libro"* **de un libro que ya devolvió**. Confunde ("¿se registró la devolución o no?"), le hace desconfiar de la app, y es justo el tipo de notificación que hace que la gente las desactive. Por eso `devolver` cancela primero el recordatorio si había uno (`BibliotecaContext.tsx:218-221`), y lo mismo pasa al apagar el interruptor (`:252-255`).

**b) ¿Dónde guardo el identificador? ¿Qué pasa si la app se cierra antes?**

El id está adentro del préstamo (`Prestamo.idDeLaNotificacion`) en el Context, y se guarda en AsyncStorage junto con todo lo demás.

Si la app se cierra antes de que llegue:

- **La notificación llega igual.** La programé en el sistema operativo, que no depende de que la app esté abierta. En Android incluso sobrevive a un reinicio, gracias a `RECEIVE_BOOT_COMPLETED`.
- **El identificador:** si solo estuviera en memoria, **se perdería** al cerrar la app. Al reabrir, el préstamo no tendría id y ya no podría cancelar ese recordatorio (si devolvés el libro, la notificación llega igual).

Al persistirlo aparece el problema contrario: si la notificación **ya sonó** mientras la app estaba cerrada, al reabrir el préstamo conserva un id que ya no corresponde a nada, y el interruptor "Recordarme" aparece **prendido** aunque no haya nada pendiente.

Lo resolví así: al arrancar, comparo los ids guardados con los que el sistema todavía tiene programados (`getAllScheduledNotificationsAsync`) y limpio los que ya no están (`BibliotecaContext.tsx:95-108`). Así el interruptor siempre refleja la realidad.

**c) ¿Por qué en Android 13+ el canal se crea antes de pedir el permiso?**

Desde Android 13 las notificaciones necesitan un permiso en tiempo de ejecución (`POST_NOTIFICATIONS`), y **el sistema no muestra el cartel si la app todavía no tiene ningún canal de notificaciones**. Si llamás a `requestPermissionsAsync` sin canal, el pedido puede volver sin mostrar nada y parece que la persona dijo que no. Por eso `pedirPermisoDeNotificaciones` llama primero a `crearCanalDePrestamos()` (`permisos.ts:29-32`). Además, crear el canal antes hace que el permiso se pida en el momento que elijo yo (al tocar "Recordarme"), y no cuando a Android le parezca.

En **Android 12 o anterior** el permiso de notificaciones **no existe en tiempo de ejecución**: viene concedido al instalar, así que `requestPermissionsAsync` devuelve `granted` sin mostrar nada. El canal igual hace falta (desde Android 8 toda notificación va en un canal), pero ya no influye en el permiso. Lo único que puede pasar es que la persona apague las notificaciones a mano desde Ajustes.

**d) Permiso denegado y te entregan un libro desde el mostrador**

Te enterás por un **aviso dentro de la app**: aparece arriba de todo en "Mis reservas" (*"¡Te toca! Ya podés retirar…"*) y la pestaña muestra un numerito. Además, el libro ya figura en tus préstamos. El código que decide está en `BibliotecaContext.tsx:289-295`:

```ts
// consultamos el permiso justo ahora (no un valor guardado), porque pudo cambiar en ajustes
const puedoNotificar = await tengoPermisoDeNotificaciones().catch(() => false);
if (puedoNotificar) {
  await avisarQueTeTocaElLibro(libro.titulo).catch(() => agregarAviso(`¡Te toca! Ya podés retirar "${libro.titulo}".`));
} else {
  agregarAviso(`¡Te toca! Ya podés retirar "${libro.titulo}" en el mostrador.`);
}
```

**Consulta el permiso en ese momento** (`getPermissionsAsync`), no usa un valor guardado. Importa porque el permiso **lo maneja el sistema y la persona lo puede cambiar cuando quiera** desde Ajustes, sin pasar por la app. Con un valor viejo pasaría una de dos:

- creo que hay permiso pero lo sacaron: mando una notificación que el sistema descarta **en silencio**, y la persona nunca se entera de que le toca el libro;
- creo que no hay pero lo dieron: muestro el aviso adentro cuando podría haberle llegado afuera.

### D3. Lo que tu app pide y lo que no

Lo saqué de `npx expo config --type introspect`, que muestra el `AndroidManifest.xml` y el `Info.plist` que se generarían.

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
|---|---|---|---|
| Android | `android.permission.CAMERA` | Leer el código de barras en el escáner | El plugin y el manifest de `expo-camera` |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de "te toca" (Android 13+) | El manifest de `expo-notifications` |
| Android | `android.permission.RECEIVE_BOOT_COMPLETED` | Que los recordatorios programados sobrevivan a un reinicio del teléfono | El manifest de `expo-notifications` |
| Android | `android.permission.VIBRATE` | Vibración al llegar la notificación | Expo / `expo-notifications` |
| Android | `android.permission.INTERNET` | Conectarse a Metro en desarrollo y a las actualizaciones; mañana, a la API real | Expo, por defecto |
| Android | `RECORD_AUDIO`, ubicación, galería/almacenamiento, contactos, `SYSTEM_ALERT_WINDOW` → con `tools:node="remove"` | **Ninguna**: están bloqueados para que nadie los cuele | Yo, con `android.blockedPermissions` en `app.json` |
| iOS | `NSCameraUsageDescription` = *"Usamos tu cámara para leer el código de barras de la contratapa y abrirte la ficha del libro al toque."* | Escáner | El plugin de `expo-camera`, con mi texto (`cameraPermission`) |
| iOS | `NSMicrophoneUsageDescription` → **no se declara** | No grabamos audio | `microphonePermission: false` |
| iOS | Notificaciones locales → no llevan clave en `Info.plist`; el permiso se pide en tiempo de ejecución | Recordatorios | `expo-notifications`. Apagué `enableRemoteNotifications`, así que **no** se agrega el entitlement de push (`aps-environment`), que no uso |

**a) ¿Por qué no declaro `RECORD_AUDIO` aunque uso `expo-camera`?**

`expo-camera` también sirve para grabar video con sonido, y **por defecto** agrega `RECORD_AUDIO` en Android y el texto del micrófono en iOS. Yo solo leo códigos de barras, así que lo apago en el plugin, y por las dudas lo bloqueo también:

```json
["expo-camera", {
  "cameraPermission": "Usamos tu cámara para leer el código de barras de la contratapa y abrirte la ficha del libro al toque.",
  "microphonePermission": false,
  "recordAudioAndroid": false,
  "barcodeScannerEnabled": true
}]
```

```json
"android": {
  "blockedPermissions": ["android.permission.RECORD_AUDIO", "..."]
}
```

**b) Mañana piden "elegir una foto de portada desde la galería"**

- **Paquete:** `expo-image-picker` (con `launchImageLibraryAsync`), instalado con `npx expo install expo-image-picker`.
- **Permiso:** para **elegir** una foto, prácticamente ninguno. En Android 13+ el image picker usa el selector de fotos del sistema, que no pide permiso porque la persona elige qué compartir. En iOS 14+ usa `PHPicker`, que tampoco lo necesita. Configuraría el plugin con `photosPermission` (en iOS) y `microphonePermission: false` para no declarar de más. Además tendría que **sacar `READ_MEDIA_IMAGES` de mis `blockedPermissions`** si en algún Android viejo hiciera falta.
- **¿OTA o build nueva?** **Hace falta una build nueva.** Una actualización OTA (`eas update`) solo cambia el JavaScript y los assets. `expo-image-picker` trae **código nativo** que no está en el binario instalado, y además cambia el `Info.plist` y el `AndroidManifest`. Si mandara el JS por OTA, la app buscaría un módulo nativo que no existe y se rompería. En Expo Go andaría (porque Expo Go ya trae ese módulo), pero eso no sirve para la versión de la tienda.

**c) ¿Qué no pude verificar del todo en Expo Go?**

- **El texto de propósito:** el cartel de la cámara muestra el texto **de Expo Go**, no el mío, porque el `Info.plist` que manda es el de Expo Go.
- **`blockedPermissions` y el mínimo privilegio:** Expo Go declara todos los permisos que pueden necesitar sus módulos (micrófono, ubicación…). Ahí no se ve que mi app no pida micrófono.
- **El canal de Android:** se crea, pero aparece adentro de los ajustes de **Expo Go**, mezclado con los de otras apps de prueba, y con el ícono y el nombre de Expo Go.
- **El nombre de la app** en los carteles del sistema dice "Expo Go".
- **El scheme `bibliotecaipf://`:** en Expo Go no está registrado, por eso los deep links se prueban con `exp://IP:8081/--/…`.

**Cómo lo verificaría:** con una **development build** (`npx expo run:android`, o `eas build --profile development`). Ahí el cartel muestra mi texto y el nombre "Biblioteca IPF". Revisaría el `AndroidManifest.xml` final (con `npx expo prebuild` se puede leer en `android/app/src/main/AndroidManifest.xml`, o con `aapt dump permissions` sobre el APK). Y en Ajustes → Apps → Biblioteca IPF → Notificaciones debería aparecer el canal "Préstamos de la biblioteca".

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

**a) Problemas encontrados**

| # | Línea | Tipo | Qué pasa y por qué | Cómo lo corregiría |
|---|---|---|---|---|
| 1 | 18-20 | **Error de ejecución / rendimiento** (el más grave) | `useEffect` **sin array de dependencias** corre después de **cada** render. Hace `setLibros(datos)` con un array nuevo, que provoca un render, que vuelve a correr el efecto… Bucle infinito de pedidos (ver b) | `useEffect(..., [])`, o mejor, usar mi `useLibros()` |
| 2 | 19 | **Error de ejecución** | No hay `.catch`. Cuando `obtenerLibros()` falla (1 de cada 5) queda una **promesa rechazada sin manejar** (warning en rojo en desarrollo) y la persona no ve ningún error | Manejar el error y mostrar `EstadoError` con "Reintentar" |
| 3 | 18-20 | **Mala práctica / advertencia** | El efecto no tiene **limpieza**: si la pantalla se va antes de que llegue la respuesta, hace `setState` igual, y las respuestas se pueden pisar | Bandera `sigueEnPantalla` en la limpieza |
| 4 | 13-16 | **Mala práctica** (y motivo de rechazo, ver d) | Pide **cámara y notificaciones apenas se abre la app**, sin contexto ni explicación. La persona no sabe para qué y lo más probable es que diga que no a todo | Pedir cámara al tocar "Escanear", con pantalla previa; notificaciones al prender "Recordarme" |
| 5 | 15 | **Error de ejecución** (Android 13+) | `requestPermissionsAsync` **sin crear antes el canal**: el cartel puede no aparecer y queda como denegado | Crear el canal antes (`crearCanalDePrestamos`) |
| 6 | 16 | **Advertencia** (lint `exhaustive-deps`) | Usa `pedirPermiso` adentro del efecto y no está en las dependencias | Agregarlo, aunque igual el efecto no debería existir (ver 4) |
| 7 | 10 y 22 | **Mala práctica** (TypeScript) | `useState<any[]>` y `libro: any`: se pierde el tipado y `libro.titlo` (mal escrito) compilaría sin avisar | `useState<Libro[]>` y `{ libro: Libro }` |
| 8 | 22-30 | **Rendimiento / mala práctica** | `Fila` está **declarado adentro** de `Catalogo`: en cada render es un componente **nuevo**, así que React desmonta y vuelve a montar todas las filas (pierden su estado y se recrean) | Sacarlo a `src/components/FilaDeLibro.tsx` |
| 9 | 33-36 | **Rendimiento** | `ScrollView` + `.map` renderiza **todos** los libros juntos, aunque no se vean. Con un catálogo grande es lento y gasta memoria | `FlatList`, que solo renderiza lo visible |
| 10 | 35 | **Advertencia / mala práctica** | `key={i}` con el índice: si la lista cambia de orden o se filtra, React confunde los elementos | `keyExtractor={(libro) => libro.isbn}` |
| 11 | 24 | **Mala práctica** | `router.push('/libro/' + libro.isbn)` arma la ruta concatenando texto, así que **se pierden las rutas tipadas**: si mañana cambia la ruta, no avisa | `href={{ pathname: '/libro/[isbn]', params: { isbn } }}` |
| 12 | 25 | **Mala práctica** | Estilo en línea con colores y tamaños fijos (`#333`, `16`, `12`): no respeta el tema ni el modo oscuro, y se recrea el objeto en cada render | `StyleSheet.create` con valores de `tema.ts` |
| 13 | 24 y 37 | **Mala práctica (accesibilidad)** | Los `Pressable` no tienen `accessibilityRole="button"`. El de la cámara es **solo ícono y sin `accessibilityLabel`**: el lector de pantalla dice "botón" y nada más. El ícono de 28 px sin padding queda por debajo de 44 × 44 | Rol, etiqueta ("Escanear código de barras") y área mínima de 44 |
| 14 | — | **Mala práctica (UX)** | No hay estados de **cargando, error ni vacío**: durante 800 ms la pantalla queda en blanco, y si falla, queda en blanco para siempre | Los tres estados con `ListEmptyComponent` |
| 15 | 11 | **Advertencia** (lint) | `permiso` se declara y nunca se usa | Borrarlo |
| 16 | 5-6 | **Mala práctica (acoplamiento)** | El Catálogo importa la cámara y las notificaciones, que no son responsabilidad suya | Que cada pantalla importe solo lo que usa |

**b) El efecto sin array de dependencias, paso a paso**

1. Render 1 (libros `[]`). Después de pintar corre el efecto y pide los libros.
2. A los ~800 ms llegan. `setLibros(datos)` con un array **nuevo** provoca el render 2.
3. Después del render 2 el efecto **vuelve a correr** (no tiene dependencias que lo frenen) y pide otra vez.
4. A los 800 ms llega otro array nuevo, que provoca el render 3, que vuelve a pedir…

Durante el primer minuto: **unos 75 pedidos y 75 renders** (uno cada ~800 ms), y nunca para. Cada render desmonta y vuelve a montar todas las filas (por el problema 8), así que la lista parpadea. En promedio 1 de cada 5 pedidos falla y deja una promesa rechazada sin manejar: unas 15 advertencias en rojo. Gasta batería, datos y CPU sin que la persona vea nada distinto.

**¿Cambiaría si `obtenerLibros()` devolviera siempre el mismo array?** **Sí: el bucle se frena.** En el paso 2, `setLibros(mismoArray)` cambia `[]` por el array, así que hay render. En el paso 4, `setLibros(mismoArray)` recibe **la misma referencia** que ya está en el estado, y React compara con `Object.is`, ve que es igual y **no vuelve a renderizar**. Sin render, el efecto no corre de nuevo. Serían 2 pedidos y listo.

El bug estaba ahí igual, solo que escondido. Y en una API real, que siempre trae objetos nuevos (como la simulada), aparece. Es un buen ejemplo de un error que "a veces" se ve.

**c) La pantalla reescrita con lo de mi app**

Es mi `src/app/(tabs)/(catalogo)/index.tsx`:

```tsx
import { FlatList, StyleSheet, Text } from 'react-native';

import { AccesosRapidos } from '../../../components/AccesosRapidos';
import { EstadoCargando } from '../../../components/EstadoCargando';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { FilaDeLibro } from '../../../components/FilaDeLibro';
import { VistosRecientes } from '../../../components/VistosRecientes';
import { ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../../../constants/tema';
import { useBiblioteca } from '../../../hooks/useBiblioteca';
import { useEstilos } from '../../../hooks/useEstilos';
import { useLibros } from '../../../hooks/useLibros';

export default function PantallaDelCatalogo() {
  const estilos = useEstilos(armarEstilos);
  const { libros, cargando, error, reintentar } = useLibros();   // con limpieza, catch y reintento
  const { ultimosVistos } = useBiblioteca();

  let loQueSeMuestraSinLibros = <EstadoVacio mensaje="Por ahora la biblioteca no tiene libros cargados." />;
  if (cargando) {
    loQueSeMuestraSinLibros = <EstadoCargando mensaje="Trayendo los libros de la biblioteca…" />;
  } else if (error) {
    loQueSeMuestraSinLibros = <EstadoError mensaje={error} textoDelBoton="Reintentar" alTocar={reintentar} />;
  }

  return (
    <FlatList
      style={estilos.lista}
      data={libros}
      keyExtractor={(libro) => libro.isbn}                        // isbn, nunca el índice
      renderItem={({ item }) => <FilaDeLibro libro={item} />}     // componente declarado afuera
      ListHeaderComponent={
        <>
          <VistosRecientes libros={ultimosVistos} />
          <AccesosRapidos />                                       {/* el permiso se pide recién al tocar "Escanear" */}
          <Text style={estilos.subtitulo} accessibilityRole="header">Todo el catálogo</Text>
        </>
      }
      ListEmptyComponent={loQueSeMuestraSinLibros}
    />
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    lista: { flex: 1, backgroundColor: colores.fondo },
    subtitulo: { color: colores.texto, fontSize: TAMANIO_LETRA.grande, fontWeight: PESO_LETRA.negrita,
      paddingHorizontal: ESPACIO.grande, paddingTop: ESPACIO.enorme, paddingBottom: ESPACIO.chico },
  });
}
```

Los botones (`Boton`, `BotonSoloIcono`) ya traen `accessibilityRole="button"` y un área mínima de 44 × 44. `BotonSoloIcono` **obliga** a pasar `etiquetaAccesible`: si te la olvidás, TypeScript no compila.

**d) ¿Cuál provoca el rechazo en una tienda y cuál la desinstalación?**

- **Rechazo en la tienda:** pedir **cámara y notificaciones apenas se abre la app, sin contexto** (líneas 13-16). Apple, en su guía de revisión (sección 5.1.1, privacidad), exige que los permisos se pidan cuando tienen sentido y con un propósito claro. Una app que pide la cámara al abrir, antes de que exista algo para escanear, es un motivo típico de rechazo. Si además faltara el texto de propósito (`NSCameraUsageDescription`), la app directamente se cierra al pedir la cámara, y Apple la rechaza seguro.
- **Lo que hace que una persona la desinstale primero:** también arranca por esas líneas. **Dos carteles de permisos al abrir por primera vez**, sin saber para qué, son la primera impresión y la peor. Pero lo que termina de echarla es **el bucle infinito** (18-20): la app gasta batería y datos en silencio, la lista parpadea, y si la red falla queda en blanco sin explicación ni botón para reintentar. Un usuario no sabe qué es un `useEffect`, pero sí ve que la app "anda mal" y que el teléfono se calienta.

### E2. Organización y acoplamiento

**a) ¿Quién importa a quién?**

```
app ─────────► components, hooks, lib, constants, types   (y el _layout raíz importa context, para montar el proveedor)
components ──► hooks, lib, constants, types, otros components
hooks ───────► context (solo useBiblioteca), lib, constants, types
context ─────► estructuras, lib, data, constants, types
lib ─────────► data, constants, types   (lib/permisos usa lib/notificaciones)
data ────────► types
constants ───► types
estructuras ─► (nada)
types ───────► (nada)
```

**No hay importaciones "hacia arriba"**: lo comprobé buscando en todo `src` imports que apunten a `src/app` (`grep -rn "from '../app" src`) y no aparece ninguno. Tampoco hay ciclos: el Context no importa hooks, y los hooks que usan el Context entran por `useBiblioteca`.

Si un hook importara algo de `src/app` sería un problema porque:

- En Expo Router, **todo archivo de `src/app` es una ruta**: si un hook necesita algo de ahí, esa pantalla queda atada al hook, y mover o renombrar la ruta rompe el hook.
- Se arman **ciclos de imports** (la pantalla importa el hook, que importa la pantalla), que en Metro pueden dar `undefined` en tiempo de ejecución.
- Se pierde la gracia de las capas: el hook ya no se puede reutilizar ni testear sin arrastrar una pantalla entera.

**b) Si el catálogo viniera de una API real, ¿qué archivos cambiarían?**

Siendo honesto, más de dos:

1. `src/lib/api.ts`: `fetch` en vez de la simulación (esto es lo esperable).
2. `src/lib/catalogo.ts`: `encontrarLibroPorIsbn` hoy es **sincrónica** y lee `data/libros.ts` directo. Con una API tendría que ser asíncrona.
3. Por lo tanto, todo lo que la usa: el detalle (`libro/[isbn].tsx`), la confirmación (`reservar/[isbn].tsx`), el escáner (`escanear.tsx`), el mostrador (`mostrador.tsx`) y el Context (`reservar`, `entregarAlSiguiente`, `reservasEnEspera`). Todos necesitarían estados de cargando y error.
4. `src/data/libros.ts` desaparecería, o quedaría solo para tests.

**¿Qué me dice eso?** Que la búsqueda de un libro por ISBN quedó **desparramada**: muchas pantallas dependen de que los datos estén "a mano" en forma sincrónica. Lo hice así para simplificar (el detalle no tiene que esperar y no puede fallar), pero acopla todo a los datos locales. Lo mejor sería un único punto de acceso, por ejemplo un hook `useLibro(isbn)` que devuelva `{ libro, cargando, error }`, o un caché del catálogo en el Context. Así el cambio a una API real tocaría `api.ts` y ese hook, y las pantallas ya estarían preparadas para esperar.

**c) ¿Y un `<ConPermiso recurso="camara">…</ConPermiso>`?**

**Lo que ganaría:**

- Es declarativo y corto: envolvés la cámara y listo.
- Sería imposible renderizar la cámara sin permiso: el componente lo garantiza.
- Los cuatro estados quedan resueltos en un solo lugar, igual para todas las pantallas.

**Lo que perdería:**

- **Flexibilidad de la interfaz:** mi escáner muestra cosas distintas en cada estado, pero **siempre** muestra el ingreso manual del ISBN. Con un envoltorio que reemplaza todo su contenido, tendría que sacar el ingreso manual afuera o pasarle "slots" para cada estado, y termina siendo un componente lleno de props.
- **La pantalla previa como ruta propia:** hoy `/permisos/camara` es un modal con URL. Se puede abrir desde el Catálogo antes del escáner, o por deep link. Si la explicación vive adentro de `<ConPermiso>`, deja de ser una pantalla.
- **Pedir el permiso como respuesta a una acción:** el envoltorio decide cuando se **renderiza**, no cuando la persona **toca** algo.

**¿Me serviría para las notificaciones? No.** Las notificaciones no envuelven ninguna pantalla ni componente: se piden **cuando la persona prende un interruptor**, adentro de un manejador de eventos (`cambiarRecordatorio` en `reservas.tsx`). Ahí no hay nada que "envolver"; necesito una función que pueda llamar (`pedir()`) y un estado que pueda consultar. Por eso me quedo con el hook `usePermiso`, que sirve para los dos casos. Si quisiera el envoltorio para la cámara, lo armaría **encima** del hook, no en su lugar.

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja |
|---|---|---|
| `obtenerLibros()` falla | Cartel rojo: *"No pudimos conectarnos con la biblioteca. Revisá tu conexión y probá de nuevo."* con el botón **"Reintentar"** | `useLibros.ts:33-38` (el `.catch`) y `(catalogo)/index.tsx:23-24` (`EstadoError`) |
| Se abre `/libro/abc` | *"“abc” no parece un ISBN: tiene que tener 13 números, sin guiones."* y el botón **"Volver al catálogo"**. El header dice "Libro no encontrado" | `libro/[isbn].tsx:28-39` y `catalogo.ts:15` |
| Se escanea un ISBN que no está en el catálogo | Aviso amarillo *"El código … no está en nuestro catálogo…"*. La cámara sigue escaneando y el aviso no se repite para el mismo código | `escanear.tsx:29-35` (lógica) y `:85-90` (cartel) |
| La cámara está bloqueada | *"La cámara está bloqueada para esta app…"*, el botón **"Abrir Ajustes"** y **siempre** el ingreso manual del ISBN | `escanear.tsx:73-80`, `ExplicacionDelPermiso.tsx:31-33` y `permisos.ts:17` |
| Las notificaciones están denegadas | Cartel en "Mis reservas": *"Las notificaciones están bloqueadas. No pasa nada: los avisos te aparecen acá adentro."* Al prender "Recordarme" se abre la pantalla previa (con "Abrir Ajustes" si está bloqueado) y los avisos se ven dentro de la app | `reservas.tsx:36-38`, `CartelDeNotificaciones.tsx`, `permisos/[recurso].tsx:39-41` y `BibliotecaContext.tsx:293-295` |
| Se intenta reservar un libro ya reservado | En el detalle no aparece "Reservar", sino *"Ya reservaste este libro."* + "Ver mis reservas". Si se llega al modal igual (por link), dice *"Ya reservaste "…". No hace falta hacerlo dos veces."* | `libro/[isbn].tsx:65-68`, `reservar/[isbn].tsx:40-48` y `BibliotecaContext.tsx:177-179` |
| "Entregar al siguiente" con la lista de espera vacía | El libro sale del mostrador apenas se vacía su cola. Si no queda ninguno: *"Nadie está esperando libros en este momento."* Si igual se llamara, la función devuelve `nadie-esperando` y se muestra *"Nadie está esperando… no había a quién entregárselo."* | `mostrador.tsx:53` y `:77`, y `BibliotecaContext.tsx:266-268` |
| Login con clave incorrecta | *"El usuario o la clave no coinciden. Fijate si están bien escritos y probá de nuevo."* El modal no se cierra, así que puede volver a intentar | `login.tsx:53-57` |

En ningún caso la respuesta es "nada" o "la app se rompe".

### E4. Decisiones con argumentos

**a) ISBN como parámetro de ruta y key, o un id numérico propio**

**Me quedo con el ISBN**, como **string**.

- El escáner lee justamente el ISBN (el EAN-13 de la contratapa **es** el ISBN-13), así que del código de barras al detalle no hay que traducir nada.
- Los deep links quedan legibles y estables: `bibliotecaipf://libro/9789500725347` funciona en cualquier teléfono. Un id propio depende de mi base de datos.
- **Dos ediciones del mismo título tienen ISBN distinto**, y para una biblioteca está bien: son ejemplares distintos (otra editorial, otra traducción, otro año). Se ven como dos libros, que es lo correcto.
- `useLocalSearchParams` **siempre devuelve texto** (o un array de textos). Me acuerdo del E1 del TP 2: si usara un id numérico tendría que hacer `Number(id)` y cuidarme de `NaN`, de `"007"` contra `7`, y de comparar `"5" === 5` (que da `false`). Con el ISBN como string comparo texto contra texto y valido con una regex (`catalogo.ts:15`). Además, `leerParametroDeTexto` (`catalogo.ts:8`) cubre el caso de que llegue un array.

**El punto débil son los libros sin ISBN**: libros viejos (anteriores a 1970), donaciones, tesis o apuntes de la cátedra. Si la biblioteca los cargara, pasaría a un **id propio de tipo string** (por ejemplo `"ipf-000123"`) como clave y parámetro de ruta, y dejaría el ISBN como campo opcional para buscar con el escáner. Lo haría string y no número, por lo mismo de antes.

**b) Clase `Pila` con `#items` o un array en el estado**

**Lo que me dio la clase:**

- **Encapsulamiento de verdad**: con `#items` nadie de afuera puede hacer `pila.items.splice(...)` y romper la regla "último en entrar, primero en salir". Solo existen las operaciones que tienen sentido.
- Un vocabulario claro (`apilar`, `verTope`, `encolar`, `verFrente`) que se lee mejor que `[...arr, x]` y `arr.slice(1)`.
- La `Cola` sin `shift()`, con punteros, y tests que garantizan que se porta bien (12 casos).

**Lo que me complicó con React:**

- React necesita **referencias nuevas** para enterarse de los cambios, y una clase está pensada para **mutarse**. Tuve que agregar `clonar()` y prohibirme mutar las que están en el estado (B3 c).
- **No se puede guardar directo en AsyncStorage**: `JSON.stringify` de una clase con campos `#privados` da `{}`, porque los privados no se serializan. Tuve que aplanar con `aArray()` al guardar y reconstruir al leer (`aplanarListas` y `armarListasIniciales` en el Context).
- Para mostrar los 3 recientes igual termino en un array (`aArray().slice(-3).reverse()`).

Con un array en el estado todo eso sale gratis. Aun así me quedo con la clase para las colas de espera, donde el orden es una regla del negocio (el mostrador **tiene** que respetarlo). Para "vistos recientemente", sinceramente, un array habría alcanzado.

**c) `useMemo` y `useCallback`**

Sí los usé. **Donde aportan:**

- **El `value` del Context** (`BibliotecaContext.tsx:330`). Sin `useMemo`, cada render del proveedor crea un objeto nuevo y **todos** los consumidores se vuelven a renderizar, aunque no haya cambiado nada.
- **`anotarComoVisto` con `useCallback`.** Está en las dependencias del efecto del detalle (`libro/[isbn].tsx:22-26`). Si cambiara en cada render, el efecto correría de nuevo en cada render del detalle.

**Donde son ruido:**

- El `useMemo` de `librosConEspera` en el mostrador: recorre 2 o 3 colas, y calcularlo de nuevo cuesta menos que comparar las dependencias.
- En general, en este proyecto tengo **el React Compiler prendido** (`"reactCompiler": true` en `app.json`), que memoriza solo. Varios de los `useCallback` del Context probablemente ya no hagan falta; los dejé porque explican la intención y porque el lint de dependencias los necesita para quedar limpio.

**¿Cómo lo comprobaría en vez de suponerlo?** Con el **Profiler de React DevTools** (`npx expo start` → `j` para abrir las herramientas). Grabás una interacción (por ejemplo, prender "Recordarme") y ves qué componentes se renderizaron, cuánto tardaron y **por qué** (la opción "Why did this render?"). Sacaría el `useMemo` del `value`, repetiría la misma interacción y compararía. Si no cambia nada medible, era ruido.

**d) Datos duplicados: ¿guardé los "ejemplares disponibles"?**

**No, los calculo.** `calcularEjemplaresDisponibles(libro, prestamos)` (`catalogo.ts:27-32`) hace `ejemplares iniciales − mis préstamos que salieron del estante`. Lo mismo con las reservas en espera (salen de las colas) y con los 3 recientes (salen de la pila).

**El error que aparece cuando un dato vive en dos lugares:** si guardara `disponibles` aparte, cada operación tendría que actualizar **dos** cosas: el préstamo y el contador. Alcanza con que una se olvide para que se contradigan. Por ejemplo, si `devolver` saca el préstamo pero no suma el ejemplar, el detalle dice *"No quedan ejemplares"* cuando en realidad hay uno, y la persona se anota en una lista de espera al pedo. Al revés, se podría prestar un ejemplar que no existe. Y son errores difíciles de ver, porque cada pantalla "tiene razón" según el dato que lee.

**Cómo lo evita mi diseño:** hay **una sola fuente de verdad** (`prestamos`) y todo lo demás se deriva en el render. No existe la posibilidad de que no coincidan, porque no hay nada que sincronizar. Además, separé el `origen` del préstamo (`'estante'` o `'lista-de-espera'`), así un libro que te entregó el mostrador no descuenta un ejemplar del estante: ese ejemplar lo devolvió otra persona y fue directo a vos.
