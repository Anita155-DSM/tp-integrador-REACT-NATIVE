import { Cola } from '../Cola';

describe('Cola', () => {
  test('arranca vacía y con tamaño cero', () => {
    const colaNueva = new Cola<string>();
    expect(colaNueva.estaVacia()).toBe(true);
    expect(colaNueva.tamanio).toBe(0);
  });

  test('se atiende en orden de llegada (fifo)', () => {
    const cola = new Cola<string>(['ana', 'beto']);
    cola.encolar('caro');
    expect(cola.desencolar()).toBe('ana');
    expect(cola.desencolar()).toBe('beto');
    expect(cola.desencolar()).toBe('caro');
  });

  test('desencolar una cola vacía devuelve undefined y el tamaño no se vuelve negativo', () => {
    const colaVacia = new Cola<string>();
    expect(colaVacia.desencolar()).toBeUndefined();
    expect(colaVacia.tamanio).toBe(0);
    colaVacia.encolar('ana');
    expect(colaVacia.tamanio).toBe(1);
  });

  test('verFrente muestra al primero sin sacarlo', () => {
    const cola = new Cola<string>(['ana', 'beto']);
    expect(cola.verFrente()).toBe('ana');
    expect(cola.tamanio).toBe(2);
  });

  test('aArray respeta el orden aunque ya se haya desencolado gente', () => {
    const cola = new Cola<number>([1, 2, 3]);
    cola.desencolar();
    cola.encolar(4);
    expect(cola.aArray()).toEqual([2, 3, 4]);
    expect(cola.tamanio).toBe(3);
  });

  test('clonar da una cola independiente de la original', () => {
    const original = new Cola<string>(['ana']);
    const clon = original.clonar();
    clon.encolar('beto');
    expect(original.tamanio).toBe(1);
    expect(clon.aArray()).toEqual(['ana', 'beto']);
  });
});
