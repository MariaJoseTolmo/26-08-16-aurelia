import { WarehouseFormOriginIcon } from '../icons/WarehouseIntakeFormIcons';
import { WASTE_DISPOSAL_SITE_OPTIONS } from '../wasteSidrepForm';
import { WarehouseFormCard } from './WarehouseFormCard';
import { WarehouseFormSelect, WarehouseFormTextField } from './WarehouseFormControls';
import { WasteSidrepValidationNotice } from './WasteSidrepValidationNotice';

/**
 * Tarjeta "Datos del traslado" — nodo `3765:39414`.
 *
 * Caja de `WarehouseFormCard` sin cambios, y los tres controles son los que ya
 * existen en `WarehouseFormControls`. La única sutileza es que el nodo MEZCLA las
 * dos familias de campo:
 *
 *   `3765:39426` patente   caja `text`     (border 1px · rounded-[7px] · px-[12px])
 *   `3765:39431` conductor caja `text`
 *   `3765:39436` lugar     caja `dropdown` (border 1.5px · rounded-[8px] · px-[13.5px])
 *
 * …pero los TRES rótulos son de la familia `text` (Inter Semi Bold 11.5px `#333`),
 * incluido el del selector. En la pantalla anterior el selector "Empresa
 * transportista" usaba rótulo `dropdown` (Inter Bold 10px). Es una inconsistencia
 * del diseño y se reproduce con `labelTone`, que existe para exactamente esto.
 *
 * El icono del encabezado NO es nuevo: `3765:39416` es el mismo camión de "Origen
 * del ingreso" (`3564:1363`), verificado por checksum, así que se reutiliza
 * `WarehouseFormOriginIcon`.
 *
 * CON LOS DATOS VALIDADOS la tarjeta crece de 146 a 201.25 (nodo `4085:77240`)
 * porque suma el aviso verde de `4085:77265`. Ese aviso vive en
 * `WasteSidrepValidationNotice`, que además cubre los estados de carga y error que
 * el diseño no dibuja.
 */

/** Texto del nodo `3765:39418`. */
export const SIDREP_TRANSPORT_TITLE = 'Datos del traslado';

/** Texto del nodo `3765:39420`. */
export const SIDREP_TRANSPORT_DESCRIPTION =
  'Estos datos son específicos de este viaje y se validan automáticamente contra el maestro de transportistas y destinatarios registrados.';

interface WasteSidrepTransportSectionProps {
  plate: string;
  onPlateChange: (value: string) => void;
  driver: string;
  onDriverChange: (value: string) => void;
  disposalSite: string | null;
  onDisposalSiteChange: (value: string | null) => void;
  /**
   * Resultado de la validación contra el maestro de transportistas. El aviso
   * verde del nodo `4085:77266` es su estado de éxito.
   */
  validation: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    message: string | null;
    rejectedMessage: string | null;
  };
}

export function WasteSidrepTransportSection({
  plate,
  onPlateChange,
  driver,
  onDriverChange,
  disposalSite,
  onDisposalSiteChange,
  validation,
}: WasteSidrepTransportSectionProps) {
  return (
    <WarehouseFormCard
      icon={<WarehouseFormOriginIcon className="block h-[13.5px] w-[16.875px] shrink-0 text-[#131313]" />}
      title={SIDREP_TRANSPORT_TITLE}
      description={SIDREP_TRANSPORT_DESCRIPTION}
    >
      <div className="w-full pt-[16px]">
        <div className="flex w-full items-start gap-[14px]">
          <WarehouseFormTextField
            label="Patente del vehículo"
            placeholder="Ej. RLVZ-57"
            value={plate}
            onChange={onPlateChange}
          />
          <WarehouseFormTextField
            label="Nombre del conductor"
            placeholder="Nombre completo"
            value={driver}
            onChange={onDriverChange}
          />
          <WarehouseFormSelect
            tone="dropdown"
            labelTone="text"
            label="Lugar de disposición final"
            placeholder="Seleccione"
            value={disposalSite}
            onChange={onDisposalSiteChange}
            state={{
              options: WASTE_DISPOSAL_SITE_OPTIONS,
              isLoading: false,
              isError: false,
              onRetry: () => {},
            }}
          />
        </div>
      </div>
      <WasteSidrepValidationNotice
        isLoading={validation.isLoading}
        isError={validation.isError}
        onRetry={validation.onRetry}
        message={validation.message}
        rejectedMessage={validation.rejectedMessage}
      />
    </WarehouseFormCard>
  );
}
