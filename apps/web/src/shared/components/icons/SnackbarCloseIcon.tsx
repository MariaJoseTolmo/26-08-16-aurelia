import type { SVGProps } from 'react';

/**
 * X de cerrar del snackbar — nodo Figma `3083:9723` (el icono es la instancia
 * `416:356`, componente "Close" del UI Kit, que envuelve al `292:1996`).
 *
 * ES EL MISMO GLIFO que `WarehouseFormCloseIcon` del módulo de residuos: mismo
 * `viewBox` de 13.3333 y mismo `path`, verificado carácter a carácter contra el asset
 * del nodo. Se versiona igual acá y no se importa aquél porque `shared/` no puede
 * depender de `modules/waste/`: la alternativa era mover el icono a `shared/`, y eso
 * toca la docena de pantallas de residuos que ya lo usan. La duplicación de un `path`
 * es el precio de no invertir la dependencia; el día que haga falta un tercer consumidor,
 * conviene mover aquél acá y borrar este.
 *
 * El nodo lo emplaza en una caja de 16 con el glifo en `inset-[8.33%]`, o sea
 * 13.333 × 13.333 — es `Snackbar` quien pone esas dos medidas.
 */
export function SnackbarCloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="13.3333"
      height="13.3333"
      viewBox="0 0 13.3333 13.3333"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M12.1961 13.1393C12.4549 13.398 12.8805 13.398 13.1393 13.1393C13.398 12.8805 13.398 12.4549 13.1393 12.1961L7.60981 6.66667L13.1393 1.13719C13.398 0.878456 13.398 0.452791 13.1393 0.194053C12.8805 -0.0646844 12.4549 -0.0646844 12.1961 0.194053L6.66667 5.72353L1.14137 0.194053C0.882629 -0.0646844 0.456964 -0.0646844 0.198226 0.194053C-0.0605113 0.452791 -0.0605113 0.878456 0.198226 1.13719L5.72353 6.66667L0.194053 12.1961C-0.0646844 12.4549 -0.0646844 12.8805 0.194053 13.1393C0.452791 13.398 0.878456 13.398 1.13719 13.1393L6.66667 7.60981L12.1961 13.1393Z"
        fill="currentColor"
      />
    </svg>
  );
}
