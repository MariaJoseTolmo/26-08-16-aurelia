import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos de la vista "Dashboard Residuos", exportados desde el nodo Figma
 * `3086:13957` del archivo Medio-Ambiente-Core.
 *
 * Misma convención que `WarehouseControlIcons`: el `.svg` crudo queda versionado
 * junto a este archivo y el `fill` original se reemplaza por `currentColor`, para
 * que el color lo defina quien lo usa. El valor que traía el asset se anota en su
 * comentario.
 */

/**
 * Balanza de la alerta de diferencia de peso. Figma node 3086:13911. Fill
 * original: #E8720C.
 *
 * Es el ÚNICO glifo nuevo de "Alertas activas". Los otros cuatro del bloque ya
 * existían y se reutilizan, comprobando el `path` punto por punto:
 *
 *   título (triángulo) `WarehouseOverdueBadgeIcon` (nodo 3686:25788) — razón
 *                      17.5/15 = 1.16667: 7.5→8.75, 8.325→9.7125,
 *                      13.3875→15.6188, 9.86719→11.5117
 *   fila 1 (reloj)     `ClockIcon` de `shared/components/icons` — mismo dibujo a
 *                      17.5 × 14; razón 8.75/7.5 = 10.6065/9.0913 = 1.16667
 *   fila 3 (caja)      `WarehouseFormLotIcon` (nodo 3713:26851) — razón
 *                      16.875/15 = 1.6875/1.5 = 14.3438/12.75 = 1.125
 *   descarte (X)       `WarehouseFormCloseIcon` (nodo 432:6691) — el asset del
 *                      nodo es byte a byte el `.svg` ya versionado
 */
export function WasteAlertWeightIcon(props: IconProps) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12.0003" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M12.1828 1.46282C12.5766 1.33157 12.7875 0.907351 12.6563 0.513601C12.525 0.119851 12.1008 -0.0910861 11.7094 0.0378201L9.06094 0.921414C8.73516 0.370633 8.13281 0.000320117 7.44609 0.000320117C6.41016 0.000320117 5.57109 0.839383 5.57109 1.87532C5.57109 1.94563 5.57578 2.0136 5.58281 2.08157L2.70937 3.03782C2.31563 3.16907 2.10469 3.59329 2.23594 3.98704C2.36719 4.38079 2.79141 4.59173 3.18516 4.46048L6.36094 3.4011C6.46641 3.4761 6.57891 3.53938 6.69844 3.59329V11.2503C6.69844 11.6652 7.03359 12.0003 7.44844 12.0003H11.9484C12.3633 12.0003 12.6984 11.6652 12.6984 11.2503C12.6984 10.8355 12.3633 10.5003 11.9484 10.5003H8.19844V3.59329C8.69062 3.37766 9.07031 2.96048 9.23437 2.44485L12.1852 1.46048L12.1828 1.46282ZM10.2492 6.75032L11.9461 3.83938L13.643 6.75032H10.2469H10.2492ZM11.9461 9.00032C13.4203 9.00032 14.6461 8.20345 14.8992 7.1511C14.9602 6.89329 14.8758 6.62845 14.7422 6.39876L12.5109 2.57376C12.3938 2.3722 12.1781 2.25032 11.9461 2.25032C11.7141 2.25032 11.4984 2.37454 11.3812 2.57376L9.15 6.4011C9.01641 6.63079 8.93203 6.89563 8.99297 7.15345C9.24609 8.20345 10.4719 9.00266 11.9461 9.00266V9.00032ZM2.97188 6.83938L4.66875 9.75032H1.27266L2.96953 6.83938H2.97188ZM0.0210937 10.1511C0.274219 11.2034 1.5 12.0003 2.97188 12.0003C4.44375 12.0003 5.67187 11.2034 5.925 10.1511C5.98594 9.89329 5.90156 9.62845 5.76797 9.39876L3.53672 5.57376C3.41953 5.3722 3.20391 5.25032 2.97188 5.25032C2.73984 5.25032 2.52422 5.37454 2.40703 5.57376L0.178125 9.4011C0.0445312 9.63079 -0.0398437 9.89563 0.0210937 10.1534V10.1511Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Chip de color de la leyenda de tonos. Figma nodes 3785:46384 (#00B398),
 * 3785:46388 (#E8720C) y 3785:46392 (#BD3B5B).
 *
 * LOS TRES NODOS SON EL MISMO PATH y solo cambian de `fill`. Se versiona UN
 * `.svg` y el color lo pone quien lo usa desde `ACCUMULATION_TONE_STYLES`, que es
 * la misma fuente que pinta las barras: así la leyenda no puede quedar diciendo
 * un color distinto del que se dibuja.
 */
export function WasteAccumulationLegendChipIcon(props: IconProps) {
  return (
    <svg width="12.5" height="10" viewBox="0 0 12.5 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M3.125 0.625H9.375C10.0645 0.625 10.625 1.18555 10.625 1.875V8.125C10.625 8.81445 10.0645 9.375 9.375 9.375H3.125C2.43555 9.375 1.875 8.81445 1.875 8.125V1.875C1.875 1.18555 2.43555 0.625 3.125 0.625Z" fill="currentColor" />
    </svg>
  );
}

// Glifo de la línea "Hoy" en la leyenda. Figma node 3785:46396. Fill original: #001E39.
export function WasteAccumulationTodayLineIcon(props: IconProps) {
  return (
    <svg width="12.5" height="10" viewBox="0 0 12.5 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M5.625 1.25C5.625 0.904297 5.3457 0.625 5 0.625C4.6543 0.625 4.375 0.904297 4.375 1.25V8.75C4.375 9.0957 4.6543 9.375 5 9.375C5.3457 9.375 5.625 9.0957 5.625 8.75V1.25ZM8.125 1.25C8.125 0.904297 7.8457 0.625 7.5 0.625C7.1543 0.625 6.875 0.904297 6.875 1.25V8.75C6.875 9.0957 7.1543 9.375 7.5 9.375C7.8457 9.375 8.125 9.0957 8.125 8.75V1.25Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Flecha de tendencia de la tarjeta "Retiros peligrosos (mes)". Figma node
 * 3086:13818. Fill original: #006153.
 *
 * El diseño solo trae la variante hacia ARRIBA. La bajada la resuelve
 * `WasteKpiCard` rotando este mismo icono 180°, en vez de un segundo asset.
 */
export function WasteKpiTrendUpIcon(props: IconProps) {
  return (
    <svg width="13.75" height="11" viewBox="0 0 13.75 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M7.36055 0.201953C7.09199 -0.0666016 6.65586 -0.0666016 6.3873 0.201953L2.9498 3.63945C2.68125 3.90801 2.68125 4.34414 2.9498 4.6127C3.21836 4.88125 3.65449 4.88125 3.92305 4.6127L6.1875 2.34824V10.3125C6.1875 10.6928 6.49473 11 6.875 11C7.25527 11 7.5625 10.6928 7.5625 10.3125V2.34824L9.82695 4.6127C10.0955 4.88125 10.5316 4.88125 10.8002 4.6127C11.0688 4.34414 11.0688 3.90801 10.8002 3.63945L7.3627 0.201953H7.36055Z" fill="currentColor" />
    </svg>
  );
}

// Título "Retiros no peligrosos (informativo)". Figma node 3086:13928. Fill original: #131313.
export function WasteNonHazardousWithdrawalsIcon(props: IconProps) {
  return (
    <svg width="17.5" height="14" viewBox="0 0 17.5 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M4.49258 1.75L3.79258 5.25H1.53125C1.16758 5.25 0.875 4.95742 0.875 4.59375V4.48164C0.875 4.41055 0.885938 4.34219 0.907813 4.27383L1.59961 2.19844C1.68984 1.93047 1.94141 1.75 2.22305 1.75H4.49258ZM5.13242 5.25L5.83242 1.75H8.09375V5.25H5.13242ZM9.40625 1.75H11.6676L12.3676 5.25H9.40625V1.75ZM13.0074 1.75H15.277C15.5586 1.75 15.8102 1.93047 15.9004 2.19844L16.5922 4.27383C16.6141 4.33945 16.625 4.41055 16.625 4.48164V4.59375C16.625 4.95742 16.3324 5.25 15.9688 5.25H13.7074L13.0074 1.75ZM1.57773 6.5625H15.925C15.9141 6.61992 15.5613 8.56953 14.8613 12.4059C14.7793 12.8516 14.3719 13.1605 13.9207 13.1195C13.4695 13.0785 13.125 12.7039 13.125 12.25V11.8125H4.375V12.25C4.375 12.7039 4.03047 13.0812 3.5793 13.1223C3.12813 13.1633 2.7207 12.8516 2.63867 12.4059C1.94141 8.5668 1.58594 6.61992 1.57773 6.5625Z" fill="currentColor" />
    </svg>
  );
}
