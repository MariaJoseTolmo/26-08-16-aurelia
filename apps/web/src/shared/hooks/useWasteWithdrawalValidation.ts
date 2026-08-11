import { useMutation, useQuery } from '@tanstack/react-query';
import {
  analyzeWeighingTicket,
  validateWithdrawalTransport,
  type ValidateWithdrawalTransportRequest,
} from '../services/waste-withdrawal-validation.service';

/**
 * Hooks de las dos validaciones del paso 1 del flujo SIDREP.
 *
 * Los componentes NO llaman al service directo: acá se envuelve, como pide
 * `STATE_MANAGEMENT.md`. Los dos son server state, así que van con TanStack Query
 * y no con Zustand —ahí solo vive el borrador que cruza rutas—.
 */

/**
 * Valida patente y tipo de residuo contra el maestro de transportistas.
 *
 * ES `useQuery` Y NO `useMutation` aunque el verbo sea POST: no cambia nada en el
 * servidor, es una consulta con cuerpo. Tratarla como lectura da dos cosas que
 * importan acá: se revalida sola cuando el usuario corrige un campo —la
 * `queryKey` incluye el input— y no repite el pedido si vuelve al mismo valor.
 *
 * `input` en `null` significa "todavía no hay con qué validar": el formulario está
 * incompleto y la query queda deshabilitada en vez de disparar un pedido que el
 * backend rechazaría.
 *
 * `retry: false` porque el error que interesa mostrar es "no se pudo validar", y
 * reintentar tres veces solo lo demora. El reintento lo pide el usuario con el
 * botón del aviso.
 */
export function useWithdrawalTransportValidation(input: ValidateWithdrawalTransportRequest | null) {
  return useQuery({
    queryKey: ['waste', 'withdrawal-transport-validation', input],
    queryFn: () => validateWithdrawalTransport(input as ValidateWithdrawalTransportRequest),
    enabled: input !== null,
    retry: false,
  });
}

/**
 * Sube el ticket de pesaje y recibe los tres pesos transcritos.
 *
 * ES `useMutation` porque sube un archivo: hay efecto en el servidor y lo dispara
 * un gesto puntual del usuario, no el estado del formulario. Tampoco tendría
 * sentido cachearlo por `queryKey` —un `File` no es una clave estable—.
 */
export function useWeighingTicketAnalysis() {
  return useMutation({
    mutationFn: (file: File) => analyzeWeighingTicket(file),
  });
}
