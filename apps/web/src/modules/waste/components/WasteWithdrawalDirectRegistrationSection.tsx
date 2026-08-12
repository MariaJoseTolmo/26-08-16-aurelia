import { WarehouseFormAttachedCheckIcon } from '../icons/WarehouseIntakeFormIcons';
import { WasteWithdrawalSelectedLotIcon } from '../icons/WasteWithdrawalFormIcons';
import { WASTE_DISPOSAL_SITE_OPTIONS } from '../wasteSidrepForm';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WarehouseFormSelect, WarehouseFormTextField } from './WarehouseFormControls';

/**
 * Tarjeta "Este retiro no requiere aprobación" — nodo `3785:44731`, dentro de la
 * pantalla `3785:44514`.
 *
 * Es la HERMANA de `WasteWithdrawalSidrepNoticeSection`: las dos cuelgan de
 * `isHazardous` y son excluyentes. Su texto lo dice —"Al no ser categoría RESPEL…"—,
 * así que la condición está en el copy y no en una interpretación.
 *
 * Y ES EL FINAL DEL CAMINO, no un paso más. El retiro peligroso sigue a tres
 * pantallas de documentos SIDREP; este se registra acá mismo con un N° de Registro
 * Interno. Por eso el primario vive DENTRO de la tarjeta y no en la barra de
 * acciones: el nodo `3785:44708` solo trae "Cancelar retiro".
 *
 * Geometría del nodo: caja `success` con `px-[25px] py-[21px]`, encabezado con icono
 * 16.875 × 13.5 y `gap-[8px]`, párrafo en `pt-[3px]`, la fila de campos en `py-[14px]`
 * con `gap-[14px]`, y el botón de 34.5 de alto abajo.
 *
 * LOS DOS ICONOS YA EXISTÍAN y son el mismo dibujo, no una copia:
 *
 *   `3785:44733`  encabezado  → `WasteWithdrawalSelectedLotIcon` (razón 1.0000, misma
 *                               caja 16.875 × 13.5). Es el círculo con el check que ya
 *                               encabeza "Lote seleccionado".
 *   `4223:9606`   botón       → `WarehouseFormAttachedCheckIcon`, el check de
 *                               "Documento adjunto" del formulario de ingreso,
 *                               escalado 15/17.5. Se comparó `path` módulo escala.
 *
 * EL BOTÓN ESTÁ DIBUJADO DESHABILITADO (`bg #e3e3e3`, texto y check en `#acacac`),
 * que es el estado correcto sin patente ni lugar de disposición. El habilitado no lo
 * dibuja ningún nodo de esta pantalla: se toma el primario `#c8a064` sobre blanco,
 * que es el de TODOS los primarios del módulo —el CTA de SIDREP, el del modal
 * (`3765:40899`) y los de la barra de acciones—. Pintarlo verde para hacer juego con
 * la tarjeta sería inventar un primario que el sistema no tiene.
 */

/** Texto del nodo `3785:44735`. */
export const DIRECT_REGISTRATION_TITLE = 'Este retiro no requiere aprobación';

/** Texto del nodo `3785:44737`. */
export const DIRECT_REGISTRATION_DESCRIPTION =
  'Al no ser categoría RESPEL, este retiro se registra directamente con un N° de Registro Interno y alimenta el consolidado SINADER — sin pasar por revisión de Medio Ambiente.';

/** Rótulo del nodo `4223:9605`. En el nodo termina con un espacio, que se descarta. */
export const DIRECT_REGISTRATION_CTA_LABEL = 'Registrar retiro';

interface WasteWithdrawalDirectRegistrationSectionProps {
  plate: string;
  onPlateChange: (value: string) => void;
  disposalSite: string | null;
  onDisposalSiteChange: (value: string | null) => void;
  /** Habilita el primario. Lo compone la pantalla con el tronco común del formulario. */
  canRegister: boolean;
  onRegister?: () => void;
}

export function WasteWithdrawalDirectRegistrationSection({
  plate,
  onPlateChange,
  disposalSite,
  onDisposalSiteChange,
  canRegister,
  onRegister,
}: WasteWithdrawalDirectRegistrationSectionProps) {
  return (
    <WarehouseFormCard
      tone="success"
      icon={<WasteWithdrawalSelectedLotIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#2a5c16]" />}
      title={DIRECT_REGISTRATION_TITLE}
      description={DIRECT_REGISTRATION_DESCRIPTION}
    >
      {/* `py-[14px]` del nodo `3785:44738`, que separa el párrafo de los campos y los campos del botón. */}
      <div className="flex w-full flex-col items-start">
        <div className="w-full py-[14px]">
          <div className="flex w-full items-start gap-[14px]">
            {/*
              La patente lleva el placeholder de ESTE nodo ("Ej. TPDK84") y no el del
              paso 1 de SIDREP ("Ej. RLVZ-57"). Son dos ejemplos distintos escritos por
              el diseño en dos pantallas; unificarlos sería elegir por él.
            */}
            <WarehouseFormTextField
              label="Patente del vehículo"
              placeholder="Ej. TPDK84"
              value={plate}
              onChange={onPlateChange}
            />
            {/*
              `tone="dropdown"` con `labelTone="text"`: la caja del nodo `3785:44759`
              es la de 1.5px y `rounded-[8px]`, y su rótulo el de 11.5px `#333`. Es la
              misma combinación que el `3765:39434` del paso 1, ya documentada en
              `WarehouseFormSelect`.
            */}
            <WarehouseFormSelect
              tone="dropdown"
              labelTone="text"
              label="Lugar de disposición final"
              placeholder="Seleccione"
              value={disposalSite}
              onChange={onDisposalSiteChange}
              state={{
                /*
                 * El MISMO catálogo de muestra que el paso 1 de SIDREP: el lugar de
                 * disposición final no cambia según la categoría del residuo. Cuando
                 * exista su endpoint, las dos pantallas pasan a leer del mismo hook.
                 */
                options: WASTE_DISPOSAL_SITE_OPTIONS,
                isLoading: false,
                isError: false,
                onRetry: () => {},
              }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canRegister}
          onClick={onRegister}
          className={`flex h-[34.5px] items-center gap-[6px] rounded-[8px] px-[21px] transition-colors ${
            canRegister ? 'bg-[#c8a064] hover:bg-[#bb9057]' : 'cursor-not-allowed bg-[#e3e3e3]'
          }`}
        >
          <span
            className={`whitespace-nowrap text-center font-['Inter:Bold',sans-serif] text-[12px] font-bold not-italic leading-[normal] ${
              canRegister ? 'text-white' : 'text-[#acacac]'
            }`}
          >
            {DIRECT_REGISTRATION_CTA_LABEL}
          </span>
          <WarehouseFormAttachedCheckIcon
            className={`block h-[12px] w-[15px] shrink-0 ${canRegister ? 'text-white' : 'text-[#acacac]'}`}
          />
        </button>
      </div>
    </WarehouseFormCard>
  );
}
