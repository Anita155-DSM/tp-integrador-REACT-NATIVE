import { useContext } from 'react';

import { BibliotecaContext, type ValorDeLaBiblioteca } from '../context/BibliotecaContext';

export function useBiblioteca(): ValorDeLaBiblioteca {
  const valor = useContext(BibliotecaContext);
  if (!valor) {
    // esto solo pasa si alguien usa el hook fuera del proveedor: es un error de programación, no de la persona usuaria
    throw new Error('useBiblioteca tiene que usarse adentro de <ProveedorDeBiblioteca>.');
  }
  return valor;
}
