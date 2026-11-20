import { Pila } from '../Pila';

describe('Pila', () => {
  test('arranca vacía y con tamaño cero', () => {
    const pilaNueva = new Pila<string>();
    expect(pilaNueva.estaVacia()).toBe(true);
    expect(pilaNueva.tamanio).toBe(0);
  });

  test('el tope es siempre el último que apilaste', () => {
    const pila = new Pila<string>();
    pila.apilar('ficciones');
    pila.apilar('rayuela');
    expect(pila.verTope()).toBe('rayuela');
    expect(pila.tamanio).toBe(2);
  });

  test('desapilar saca del tope (lifo)', () => {
    const pila = new Pila<number>([1, 2, 3]);
    expect(pila.desapilar()).toBe(3);
    expect(pila.desapilar()).toBe(2);
    expect(pila.aArray()).toEqual([1]);
  });

  test('desapilar una pila vacía devuelve undefined y no rompe nada', () => {
    const pilaVacia = new Pila<number>();
    expect(pilaVacia.desapilar()).toBeUndefined();
    expect(pilaVacia.tamanio).toBe(0);
  });

  test('aArray devuelve una copia: tocarla no cambia la pila', () => {
    const pila = new Pila<string>(['a']);
    const copiaDeAfuera = pila.aArray();
    copiaDeAfuera.push('intruso');
    expect(pila.tamanio).toBe(1);
  });

  test('clonar da una pila independiente de la original', () => {
    const original = new Pila<string>(['a']);
    const clon = original.clonar();
    clon.apilar('b');
    expect(original.tamanio).toBe(1);
    expect(clon.tamanio).toBe(2);
    expect(clon).not.toBe(original);
  });
});
