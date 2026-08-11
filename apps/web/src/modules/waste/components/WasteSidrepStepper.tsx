/**
 * Stepper del flujo SIDREP — nodo `3765:39394`.
 *
 * Geometría del nodo:
 *
 *   fila     border-t #e3e3e3 · flex items-center · px-[22px] pt-[17px] pb-[16px]
 *            rounded-b-[10px] (cierra la tarjeta que lo contiene)
 *   paso     flex gap-[10px] items-center · `flex-[190.797_0_0] min-w-px`
 *   círculo  size-[26px] · rounded-[13px]
 *            completado bg #00b398 · número Inter Bold 11.5px white
 *            activo     bg #001e39 · número Inter Bold 11.5px white
 *            pendiente  bg #f7f7f7 · border #d1d1d1 · número Inter Bold 11.5px #acacac
 *   rótulo   completado y activo  Inter Bold    12px #131313
 *            pendiente            Inter Regular 12px #acacac
 *   línea    `flex-[210.805_0_0] min-w-px` · px-[10px] · h-px
 *            recorrida bg #00b398 · pendiente bg #d1d1d1
 *
 * LOS PASOS Y LAS LÍNEAS SON HERMANOS, no padre e hijo: en el nodo la fila tiene
 * cinco hijos (paso, línea, paso, línea, paso) y cada uno lleva su propio
 * `flex-grow`. Se reproduce igual, porque anidar la línea dentro del paso obliga a
 * sumar los dos `grow` y el reparto deja de coincidir.
 *
 * Los números 190.797 y 210.805 NO son anchos fijos: son el `flex-grow` que Figma
 * declara, o sea el reparto del espacio disponible. Van como `flexGrow` en línea
 * porque Tailwind no tiene utilidades para decimales arbitrarios de `grow`.
 *
 * Es un `<div>` y no una `<ol>`: la fila del nodo mezcla pasos con separadores, y
 * meter los separadores como `<li>` —aunque fueran `aria-hidden`— le miente al
 * lector de pantalla sobre cuántos pasos hay. La semántica la aportan el
 * `aria-label` de la fila y el `aria-current="step"` del paso en curso.
 *
 * LOS TRES ESTADOS SALEN DE DOS NODOS. `3765:39394` dibuja "paso 1 activo, 2 y 3
 * pendientes" y `3765:39825` dibuja el paso 2 activo, que es donde aparece el
 * COMPLETADO: el círculo del paso 1 pasa a `#00b398` —el teal del módulo— y la
 * línea que lo une al 2 también. El rótulo de un paso completado sigue en Inter
 * Bold `#131313`, igual que el activo.
 *
 * El completado NO lleva check: el nodo mantiene el número. Se respeta.
 */

/** Los tres pasos del nodo, en orden. */
export const WASTE_SIDREP_STEPS = ['Datos del traslado', 'Documentos de respaldo', 'Revisión y envío'] as const;

/** `flex-grow` de cada paso y de cada separador, tal como los declara el nodo. */
const STEP_GROW = 190.797;
const LINE_GROW = 210.805;

interface WasteSidrepStepperProps {
  /** Paso en curso, base 1. */
  current: number;
}

export function WasteSidrepStepper({ current }: WasteSidrepStepperProps) {
  return (
    <div
      aria-label="Progreso de la solicitud"
      className="flex w-full items-center rounded-b-[10px] border-t border-solid border-[#e3e3e3] px-[22px] pb-[16px] pt-[17px]"
    >
      {WASTE_SIDREP_STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        /* Completado y activo comparten el rótulo; solo cambia el color del círculo. */
        const reached = done || active;

        return (
          <div key={label} className="contents">
            <div
              className="flex min-w-px items-center gap-[10px]"
              style={{ flexGrow: STEP_GROW, flexBasis: 0 }}
            >
              <span
                className={`flex size-[26px] shrink-0 items-center justify-center rounded-[13px] ${
                  done
                    ? 'bg-[#00b398]'
                    : active
                      ? 'bg-[#001e39]'
                      : 'border border-solid border-[#d1d1d1] bg-[#f7f7f7]'
                }`}
              >
                <span
                  className={`whitespace-nowrap font-['Inter:Bold',sans-serif] text-[11.5px] font-bold not-italic leading-[normal] ${
                    reached ? 'text-white' : 'text-[#acacac]'
                  }`}
                >
                  {step}
                </span>
              </span>
              <span
                aria-current={active ? 'step' : undefined}
                className={`whitespace-nowrap not-italic leading-[normal] text-[12px] ${
                  reached
                    ? "font-['Inter:Bold',sans-serif] font-bold text-[#131313]"
                    : "font-['Inter:Regular',sans-serif] font-normal text-[#acacac]"
                }`}
              >
                {label}
              </span>
            </div>
            {step < WASTE_SIDREP_STEPS.length ? (
              <div
                aria-hidden
                className="flex min-w-px items-start px-[10px]"
                style={{ flexGrow: LINE_GROW, flexBasis: 0 }}
              >
                {/* La línea se pinta teal solo si el paso que la sigue ya se alcanzó. */}
                <span className={`h-px w-full ${step < current ? 'bg-[#00b398]' : 'bg-[#d1d1d1]'}`} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
