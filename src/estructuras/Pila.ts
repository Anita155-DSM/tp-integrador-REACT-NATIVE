// pila clásica: el último que entra es el primero que sale (lifo).
// la usamos para los "vistos recientemente": el tope es el libro que abriste último.
export class Pila<T> {
  #items: T[] = [];

  constructor(elementosIniciales: T[] = []) {
    this.#items = [...elementosIniciales];
  }

  apilar(elemento: T): void {
    this.#items.push(elemento);
  }

  desapilar(): T | undefined {
    return this.#items.pop();
  }

  verTope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  estaVacia(): boolean {
    return this.#items.length === 0;
  }

  get tamanio(): number {
    return this.#items.length;
  }

  // devuelve una copia de base a tope, así nadie de afuera nos toca el array interno
  aArray(): T[] {
    return [...this.#items];
  }

  // react necesita un objeto nuevo para enterarse del cambio, por eso clonamos antes de apilar
  clonar(): Pila<T> {
    return new Pila(this.#items);
  }
}
