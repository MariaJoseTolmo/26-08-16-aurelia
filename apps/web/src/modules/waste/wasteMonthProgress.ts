/**
 * Avance del mes en curso, usado por el recuadro informativo y por el marcador
 * "Hoy" de las barras de acumulado.
 */

export interface MonthProgress {
  /** Día del mes, 1-31. */
  day: number;
  /** Días que tiene el mes en curso. */
  daysInMonth: number;
  /** Porcentaje transcurrido del mes, entero. */
  elapsedPercentage: number;
}

/**
 * Días del mes al que pertenece la fecha.
 *
 * `new Date(año, mes + 1, 0)` cae en el último día del mes indicado, así que
 * `getDate()` devuelve su cantidad de días. Resuelve febrero y los años
 * bisiestos sin tabla propia.
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getMonthProgress(date: Date): MonthProgress {
  const day = date.getDate();
  const daysInMonth = getDaysInMonth(date);

  return {
    day,
    daysInMonth,
    elapsedPercentage: Math.round((day / daysInMonth) * 100),
  };
}

/**
 * El recuadro del diseño parte la frase en dos párrafos ("Hoy es el día 16 de
 * 31 del mes." + "del mes (52% transcurrido). …"). En el PDF y el Excel no hay
 * dos párrafos: acá se compone la frase completa, con los mismos números.
 */
export function formatMonthProgressSentence(progress: MonthProgress, advice: string): string {
  return `Hoy es el día ${progress.day} de ${progress.daysInMonth} del mes (${progress.elapsedPercentage}% transcurrido). ${advice}`;
}
