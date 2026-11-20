import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';

import { Boton } from '../components/Boton';
import { EstadoCargando } from '../components/EstadoCargando';
import { IngresoManualDeIsbn } from '../components/IngresoManualDeIsbn';
import { TEXTOS_DE_PERMISOS } from '../constants/permisos';
import { BORDE_REDONDEADO, ESPACIO, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useEstilos } from '../hooks/useEstilos';
import { usePermiso } from '../hooks/usePermiso';
import { encontrarLibroPorIsbn, esIsbnValido } from '../lib/catalogo';

const ALTO_DEL_VISOR = 280;

export default function PantallaDelEscaner() {
  const estilos = useEstilos(armarEstilos);
  const { estado, abrirAjustes } = usePermiso('camara');
  // useRef y no useState: el cambio tiene que verse YA, en el próximo llamado, sin esperar un render
  const yaSaliDelEscaner = useRef(false);
  const ultimoCodigoQueNoEstaba = useRef<string | null>(null);
  const [codigoDesconocido, setCodigoDesconocido] = useState<string | null>(null);

  function irAlLibro(isbn: string) {
    if (yaSaliDelEscaner.current) {
      return;
    }
    if (!encontrarLibroPorIsbn(isbn)) {
      // el mismo código frente a la cámara dispara muchas veces: avisamos una sola
      if (ultimoCodigoQueNoEstaba.current !== isbn) {
        ultimoCodigoQueNoEstaba.current = isbn;
        setCodigoDesconocido(isbn);
      }
      return;
    }
    yaSaliDelEscaner.current = true;
    // dismissTo saca el escáner de la pila: "atrás" desde el detalle vuelve al catálogo y no a la cámara
    router.dismissTo({ pathname: '/libro/[isbn]', params: { isbn } });
  }

  function alLeerUnCodigo({ data }: BarcodeScanningResult) {
    const soloNumeros = data.replace(/[^0-9]/g, '');
    if (esIsbnValido(soloNumeros)) {
      irAlLibro(soloNumeros);
    }
  }

  let parteDeLaCamara = <EstadoCargando mensaje="Revisando el permiso de la cámara…" />;
  if (estado === 'concedido') {
    parteDeLaCamara = (
      <View style={estilos.visor}>
        <CameraView
          style={estilos.camara}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={alLeerUnCodigo}
        />
        <Text style={estilos.ayuda}>Apuntá al código de barras de la contratapa.</Text>
      </View>
    );
  } else if (estado === 'preguntable') {
    parteDeLaCamara = (
      <View style={estilos.cartel}>
        <Text style={estilos.texto}>{TEXTOS_DE_PERMISOS.camara.beneficio}</Text>
        <Boton
          texto="Usar la cámara"
          icono="camera-outline"
          alTocar={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara' } })}
        />
      </View>
    );
  } else if (estado === 'bloqueado') {
    parteDeLaCamara = (
      <View style={estilos.cartel}>
        <Text style={estilos.texto}>{TEXTOS_DE_PERMISOS.camara.siEstaBloqueado}</Text>
        <Boton texto="Abrir Ajustes" icono="settings-outline" variante="secundario" alTocar={abrirAjustes} />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.pantalla} keyboardShouldPersistTaps="handled">
      {parteDeLaCamara}
      {codigoDesconocido ? (
        <View style={estilos.avisoDesconocido} accessibilityRole="alert">
          <Text style={estilos.textoAviso}>
            El código {codigoDesconocido} no está en nuestro catálogo. Probá con otro libro: la cámara sigue escaneando.
          </Text>
        </View>
      ) : null}
      {/* siempre se puede escribir el isbn a mano, haya o no cámara */}
      <IngresoManualDeIsbn alConfirmar={irAlLibro} />
    </ScrollView>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    visor: { margin: ESPACIO.grande, gap: ESPACIO.chico },
    camara: { height: ALTO_DEL_VISOR, borderRadius: BORDE_REDONDEADO, overflow: 'hidden' },
    ayuda: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.chica, textAlign: 'center' },
    cartel: {
      margin: ESPACIO.grande,
      padding: ESPACIO.grande,
      gap: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    texto: { color: colores.texto, fontSize: TAMANIO_LETRA.normal },
    avisoDesconocido: {
      marginHorizontal: ESPACIO.grande,
      padding: ESPACIO.medio,
      borderRadius: BORDE_REDONDEADO,
      backgroundColor: colores.fondoAviso,
    },
    textoAviso: { color: colores.aviso, fontSize: TAMANIO_LETRA.chica },
  });
}
