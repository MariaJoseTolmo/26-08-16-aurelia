import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Iconos del formulario "Registrar ingreso a Bodega" — nodo Figma `3564:1787`.
 *
 * Misma convención que `WarehouseIntakeIcons` y `WarehouseTableIcons`: el `.svg`
 * crudo queda versionado junto a este archivo con el id del nodo en el nombre, y
 * acá el `fill` original se reemplaza por `currentColor` para que el color lo
 * ponga quien lo usa.
 */

// Aviso de la barra de acciones. Figma node 3564:1405. Fill original: #646464.
export function WarehouseFormInfoIcon(props: IconProps) {
  return (
    <svg width="13.75" height="11" viewBox="0 0 13.75 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M6.875 11C8.33369 11 9.73264 10.4205 10.7641 9.38909C11.7955 8.35764 12.375 6.95869 12.375 5.5C12.375 4.04131 11.7955 2.64236 10.7641 1.61091C9.73264 0.579463 8.33369 0 6.875 0C5.41631 0 4.01736 0.579463 2.98591 1.61091C1.95446 2.64236 1.375 4.04131 1.375 5.5C1.375 6.95869 1.95446 8.35764 2.98591 9.38909C4.01736 10.4205 5.41631 11 6.875 11ZM6.1875 3.4375C6.1875 3.25516 6.25993 3.0803 6.38886 2.95136C6.5178 2.82243 6.69266 2.75 6.875 2.75C7.05734 2.75 7.2322 2.82243 7.36114 2.95136C7.49007 3.0803 7.5625 3.25516 7.5625 3.4375C7.5625 3.61984 7.49007 3.7947 7.36114 3.92364C7.2322 4.05257 7.05734 4.125 6.875 4.125C6.69266 4.125 6.5178 4.05257 6.38886 3.92364C6.25993 3.7947 6.1875 3.61984 6.1875 3.4375ZM6.01562 4.8125H7.04688C7.33262 4.8125 7.5625 5.04238 7.5625 5.32812V7.21875H7.73438C8.02012 7.21875 8.25 7.44863 8.25 7.73438C8.25 8.02012 8.02012 8.25 7.73438 8.25H6.01562C5.72988 8.25 5.5 8.02012 5.5 7.73438C5.5 7.44863 5.72988 7.21875 6.01562 7.21875H6.53125V5.84375H6.01562C5.72988 5.84375 5.5 5.61387 5.5 5.32812C5.5 5.04238 5.72988 4.8125 6.01562 4.8125Z" fill="currentColor" />
    </svg>
  );
}

// Check del botón "Registrar ingreso". Figma node 3565:3036. Fill original: #ACACAC.
export function WarehouseFormSubmitCheckIcon(props: IconProps) {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M12.4406 1.64297C12.7758 1.88672 12.8508 2.35547 12.607 2.69063L6.60703 10.9406C6.47813 11.1188 6.27891 11.2289 6.05859 11.2477C5.83828 11.2664 5.625 11.1844 5.47031 11.0297L2.47031 8.02969C2.17734 7.73672 2.17734 7.26094 2.47031 6.96797C2.76328 6.675 3.23906 6.675 3.53203 6.96797L5.91094 9.34688L11.3953 1.80703C11.6391 1.47187 12.1078 1.39688 12.443 1.64063L12.4406 1.64297Z" fill="currentColor" />
    </svg>
  );
}
