import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Boton } from '../../components/Boton';
import { EstadoVacio } from '../../components/EstadoVacio';
import { DIAS_DE_PRESTAMO } from '../../constants/biblioteca';
import { BORDE_REDONDEADO, ESPACIO, PESO_LETRA, TAMANIO_LETRA, type PaletaDeColores } from '../../constants/tema';
import { useBiblioteca } from '../../hooks/useBiblioteca';
import { useEstilos } from '../../hooks/useEstilos';
import { encontrarLibroPorIsbn, esIsbnValido, leerParametroDeTexto } from '../../lib/catalogo';
import { formatearFechaLinda, sumarDiasDesdeHoy } from '../../lib/fechas';

export default function PantallaConfirmarReserva() {
  const estilos = useEstilos(armarEstilos);
  const { isbn: isbnDeLaUrl } = useLocalSearchParams<{ isbn: string }>();
  const isbn = leerParametroDeTexto(isbnDeLaUrl);
  const libro = esIsbnValido(isbn) ? encontrarLibroPorIsbn(isbn) : undefined;
  const { reservar, ejemplaresDisponibles, cuantosEsperan, yaLoReserve } = useBiblioteca();
  // por si alguien toca "confirmar" dos veces antes de que se cierre el modal
  const yaConfirme = useRef(false);
  // y esto para que, mientras se cierra, no parpadee el cartel de "ya reservaste"
  const [acaboDeConfirmar, setAcaboDeConfirmar] = useState(false);

  // dismissTo cierra el modal y lleva a la pestaña: "atrás" ya no vuelve a esta confirmación
  function irAMisReservas() {
    router.dismissTo('/reservas');
  }

  if (!libro) {
    return (
      <View style={estilos.pantalla}>
        <EstadoVacio icono="help-circle-outline" mensaje="No encontramos el libro que querés reservar.">
          <Boton texto="Cerrar" alTocar={() => router.back()} />
        </EstadoVacio>
      </View>
    );
  }

  if (yaLoReserve(libro.isbn) && !acaboDeConfirmar) {
    return (
      <View style={estilos.pantalla}>
        <EstadoVacio icono="checkmark-circle-outline" mensaje={`Ya reservaste "${libro.titulo}". No hace falta hacerlo dos veces.`}>
          <Boton texto="Ver mis reservas" alTocar={irAMisReservas} />
        </EstadoVacio>
      </View>
    );
  }

  const disponibles = ejemplaresDisponibles(libro);
  const hayEjemplar = disponibles > 0;
  const puestoQueTendria = cuantosEsperan(libro.isbn) + 1;

  function confirmar() {
    if (yaConfirme.current || !libro) {
      return;
    }
    yaConfirme.current = true;
    setAcaboDeConfirmar(true);
    reservar(libro.isbn);
    irAMisReservas();
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <View style={[estilos.cartel, hayEjemplar ? estilos.cartelBueno : estilos.cartelEspera]}>
          <Text style={estilos.texto}>
            {hayEjemplar
              ? `¡Hay ejemplar! Te lo llevás por ${DIAS_DE_PRESTAMO} días y lo devolvés el ${formatearFechaLinda(sumarDiasDesdeHoy(DIAS_DE_PRESTAMO))}.`
              : `No quedan ejemplares. Si confirmás, quedás en el puesto ${puestoQueTendria} de la lista de espera y te avisamos cuando te toque.`}
          </Text>
        </View>
        <Boton texto={hayEjemplar ? 'Confirmar préstamo' : 'Anotarme en la lista'} alTocar={confirmar} />
        <Boton texto="Mejor no" variante="secundario" alTocar={() => router.back()} />
      </View>
    </View>
  );
}

function armarEstilos(colores: PaletaDeColores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: ESPACIO.enorme, gap: ESPACIO.grande },
    titulo: { color: colores.texto, fontSize: TAMANIO_LETRA.titulo, fontWeight: PESO_LETRA.negrita },
    cartel: { padding: ESPACIO.grande, borderRadius: BORDE_REDONDEADO },
    cartelBueno: { backgroundColor: colores.fondoExito },
    cartelEspera: { backgroundColor: colores.fondoAviso },
    texto: { color: colores.texto, fontSize: TAMANIO_LETRA.normal },
  });
}
