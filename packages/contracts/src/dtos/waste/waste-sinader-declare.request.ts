/**
 * Cierre de un período SINADER — "Marcar como declarado" del nodo `4319:34781`.
 *
 * Registra que Medio Ambiente ya trasladó los totales a la Ventanilla Única del
 * RETC y con qué folio quedaron. NO HAY PASO DE VALIDACIÓN: el período pasa a
 * `declared` con esta llamada, sin aprobación de un tercero. La responsabilidad es
 * de quien declara, y el sistema sólo deja constancia.
 *
 * Es irreversible por diseño: un período declarado no admite más movimientos. Si
 * hiciera falta corregir un folio mal tipeado, eso es otra operación —y otro
 * permiso— que todavía no existe.
 */
export interface DeclareWasteSinaderPeriodRequest {
  /**
   * N° de folio que devuelve la Ventanilla Única del RETC.
   *
   * Va como STRING y no como número: es un identificador externo, puede traer
   * ceros a la izquierda o cambiar de formato, y sobre él no se hace aritmética.
   */
  folio: string;
  /**
   * Fecha de la declaración en ISO `yyyy-mm-dd`.
   *
   * Es una FECHA y no un instante: la declaración se hace un día, y la hora exacta
   * en que alguien la registró en AurelIA no es el dato. El servidor la interpreta
   * en su zona horaria al persistirla.
   */
  declaredOn: string;
}
