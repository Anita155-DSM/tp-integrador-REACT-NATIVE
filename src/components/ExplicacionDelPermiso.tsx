import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { TEXTOS_DE_PERMISOS } from '../constants/permisos';
import { ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../constants/tema';
import { useColores } from '../hooks/useColores';
import { useEstilos } from '../hooks/useEstilos';
import { usePermiso } from '../hooks/usePermiso';
import type { EstadoDelPermiso, RecursoConPermiso } from '../types';
import { Boton } from './Boton';
import { EstadoCargando } from './EstadoCargando';

type PropsDeLaExplicacion = {
  recurso: RecursoConPermiso;
  alTerminar: (estadoFinal: EstadoDelPermiso) => void;
};

// pantalla previa al cartel del sistema: una frase con el beneficio y un único botón
export function ExplicacionDelPermiso({ recurso, alTerminar }: PropsDeLaExplicacion) {
  const estilos = useEstilos(armarEstilos);
  const colores = useColores();
  const { estado, pedir, abrirAjustes } = usePermiso(recurso);
  const textos = TEXTOS_DE_PERMISOS[recurso];

  async function continuar() {
    const estadoDespuesDePreguntar = await pedir();
    alTerminar(estadoDespuesDePreguntar);
  }

  let botonQueCorresponde = <Boton texto="Continuar" alTocar={continuar} />;
  if (estado === 'bloqueado') {
    // canAskAgain en false: el sistema ya no muestra el cartel, la única salida es ajustes
    botonQueCorresponde = <Boton texto="Abrir Ajustes" icono="settings-outline" alTocar={abrirAjustes} />;
  } else if (estado === 'concedido') {
    botonQueCorresponde = <Boton texto="Listo, seguir" alTocar={() => alTerminar('concedido')} />;
  }

  return (
    <View style={estilos.contenedor}>
      <Ionicons name={textos.icono} size={56} color={colores.primario} />
      <Text style={estilos.titulo} accessibilityRole="header">
        {textos.titulo}
      </Text>
      <Text style={estilos.beneficio}>{estado === 'bloqueado' ? textos.siEstaBloqueado : textos.beneficio}</Text>
      {estado === 'cargando' ? <EstadoCargando mensaje="Revisando el permiso…" /> : botonQueCorresponde}
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    contenedor: { flex: 1, padding: ESPACIO.enorme, gap: ESPACIO.grande, justifyContent: 'center', backgroundColor: colores.fondo },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.titulo, fontWeight: PESO_LETRA.negrita, textAlign: 'center' },
    beneficio: { color: colores.textoSuave, fontSize: TAMANIO_LETRA.grande, textAlign: 'center' },
  });
}
