// cola clásica: el primero que llega es el primero que se atiende (fifo).
// la usamos para la lista de espera de cada libro.
// no usamos shift() porque reacomoda todo el array cada vez; en cambio guardamos
// dos punteros (inicio y fin) y así encolar y desencolar cuestan siempre lo mismo.
export class Cola<T> {
  #items: Record<number, T> = {};
  #inicio = 0;
  #fin = 0;

  constructor(elementosIniciales: T[] = []) {
    elementosIniciales.forEach((elemento) => this.encolar(elemento));
  }

  encolar(elemento: T): void {
    this.#items[this.#fin] = elemento;
    this.#fin++;
  }

  desencolar(): T | undefined {
    if (this.estaVacia()) {
      return undefined;
    }
    const elQueSeVa = this.#items[this.#inicio];
    delete this.#items[this.#inicio];
    this.#inicio++;
    return elQueSeVa;
  }

  verFrente(): T | undefined {
    return this.estaVacia() ? undefined : this.#items[this.#inicio];
  }

  estaVacia(): boolean {
    return this.tamanio === 0;
  }

  get tamanio(): number {
    return this.#fin - this.#inicio;
  }

  // copia ordenada del frente al fondo
  aArray(): T[] {
    const enOrden: T[] = [];
    for (let posicion = this.#inicio; posicion < this.#fin; posicion++) {
      enOrden.push(this.#items[posicion]);
    }
    return enOrden;
  }

  // igual que en la pila: para avisarle a react armamos una cola nueva con lo mismo adentro
  clonar(): Cola<T> {
    return new Cola(this.aArray());
  }
}
