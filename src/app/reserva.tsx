import { Redirect } from 'expo-router';

// /reserva era la url de la versión anterior: la mandamos a la nueva para no romper links viejos
export default function RedireccionDeLaUrlVieja() {
  return <Redirect href="/reservas" />;
}
