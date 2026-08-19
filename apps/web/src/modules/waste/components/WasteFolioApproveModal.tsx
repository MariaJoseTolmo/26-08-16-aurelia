import { useEffect, useRef, useState } from 'react';
import { WasteSinaderMarkDeclaredIcon } from '../icons/WasteSinaderReportIcons';
import {
  pendingRequestApprovalOutcome,
  pendingRequestDetailSubtitle,
  WASTE_SIDREP_APPROVE_MODAL,
  WASTE_SIDREP_APPROVE_OUTCOME_STATUS,
  type WasteSidrepPendingRequest,
} from '../wasteSidrepPendingFolios';
import { WasteFolioFooterActionButton } from './WasteFolioFooterActionButton';
import {
  WASTE_FORM_MODAL_INPUT_CLASS,
  WasteFormModal,
  WasteFormModalCancelButton,
  WasteFormModalDateInput,
  WasteFormModalField,
  WasteFormModalNotice,
} from './WasteFormModal';

/**
 * Modal "Aprobar y generar folio SIDREP" — DOS NODOS, un solo formulario en sus dos estados:
 *
 *   `3087:17238`  vacío     480 × 414.5
 *   `3087:17683`  completo  480 × 523.5
 *
 * Lo abre el botón `3073:6088`, el "Aprobar y generar folio" del pie del panel de
 * "Pendientes de revisión" (nodo `3073:5688`).
 *
 * ENTRE LOS DOS NODOS CAMBIAN EXACTAMENTE DOS COSAS, y las dos cuelgan de la misma
 * condición: el primario pasa de gris a `#c8a064` con el texto en blanco, y aparece una
 * cuarta fila en el cuerpo —el aviso verde `3087:17710`—. Todo lo demás coincide medida por
 * medida. Ver `canConfirm`.
 *
 * ES EL SÍ DE LA BANDEJA, el hermano de `WasteFolioRejectModal`. Los dos cuelgan de la
 * misma franja del pie y resuelven la misma solicitud por caminos opuestos: aquél la
 * devuelve para que la corrijan, éste la convierte en folio y la manda a "Abiertos".
 *
 * EL ARMAZÓN VIVE EN `WasteFormModal` y no se toca acá: cabecera, cuerpo, pie, velo y el
 * centrado son de allá. Se verificó que este nodo dibuja EXACTAMENTE esa tarjeta —radio de
 * 12, sombra `0 24 60 rgba(0,0,0,0.35)`, cabecera `px-[22px] pt-[18px] pb-[19px]` con la
 * "X" de 17.5 × 14 centrada en su caja de 29.5 × 19, cuerpo `px-[22px] py-[20px] gap-[16px]`
 * y pie `px-[22px] pt-[17px] pb-[16px] gap-[10px]` justificado a la derecha— en el ancho
 * `md` de 480, el mismo del modal de SINADER.
 *
 * ESTÁ CENTRADO EN LOS DOS EJES Y ESO SALE DE LOS NODOS, no de una preferencia. Sobre el
 * mismo viewport de 1320 × 720:
 *
 *   `3087:17238`  480 × 414.5 en x=420, y=152.5 → 420+480+420 = 1320 · 152.5+414.5+153 = 720
 *   `3087:17683`  480 × 523.5 en x=420, y=98    → 420+480+420 = 1320 · 98+523.5+98.5 = 720
 *
 * LOS DOS ESTÁN CENTRADOS CON ALTOS DISTINTOS, que es la prueba de que el centrado es una
 * regla y no una coordenada: el aviso verde empuja la tarjeta 109px y el diálogo se reacomoda
 * solo. Por eso el `items-center justify-center` del velo, y no un `top` calculado.
 *
 * NO GENERA EL FOLIO: LO REGISTRA. El SIDREP se emite en la Ventanilla Única del RETC —una
 * plataforma del Ministerio, fuera de AurelIA— y lo que este formulario hace es transcribir
 * el número que aquélla devolvió. Es la misma división de trabajo que `WasteFolioCloseModal`,
 * donde la declaración también se cierra afuera y acá se registra. Ver
 * `WASTE_SIDREP_APPROVE_MODAL`.
 *
 * "CONFIRMAR Y NOTIFICAR" ENTRA DESHABILITADO, y no es una desviación: el nodo `3087:17268`
 * lo pinta gris con el texto en `#acacac`, que es lo correcto con los dos campos vacíos. Se
 * habilita con folio Y fecha, y con `onConfirm` presente —mismo criterio que el resto de los
 * modales del módulo—.
 *
 * EL GRIS DEL DESHABILITADO SE DEJA EN `#e2e2e2` Y NO EN EL `#e3e3e3` QUE ESTE NODO ESCRIBE.
 * No es un descuido: los otros dos nodos del mismo botón —`4230:13314` y `4319:34845`— dicen
 * `#e2e2e2`, así que dos contra uno, y `#e3e3e3` es además el token de línea del módulo, o
 * sea el valor que se cuela cuando alguien copia el color de un borde. Forkear
 * `WasteFolioFooterActionButton` por una unidad de gris habría dejado dos deshabilitados
 * distintos en el mismo pie de modal.
 *
 * LOS TRES GLIFOS SON EXPORTS QUE YA EXISTEN, verificados trazado contra trazado:
 *
 *   "i" 11.5 del aviso azul    `WasteSinaderNoticeIcon`      idéntico, misma caja
 *   tilde 15 × 12 del primario `WasteSinaderMarkDeclaredIcon` idéntico, misma caja
 *   tilde 11.5 del aviso verde `WasteFolioVerifiedIcon`      el mismo path por 11.5/11
 *
 * Los dos primeros coinciden carácter por carácter con los assets del nodo; el tercero se
 * comparó token a token —96 números, 4.09e-5 de desviación máxima, que es el redondeo a 5
 * cifras del exportador de Figma— y los 22 comandos son los mismos. Los tres los trae
 * bakeados el componente que los usa. Cero iconos nuevos.
 *
 * Geometría propia del cuerpo (el resto, en `WasteFormModal`):
 *
 *   aviso azul  `3087:17249`  tres líneas, la del medio en Inter Bold · 11.5px / 17.25px
 *   folio       `3087:17253`  rótulo + `<input>` de 36px, `rounded-[7px]`, borde #d1d1d1
 *   fecha       `3087:17258`  rótulo + selector de fecha con el calendario de 18 × 18
 *   aviso verde `3087:17710`  dos párrafos, "Abierto" en Inter Bold dentro del primero
 */

interface WasteFolioApproveModalProps {
  open: boolean;
  /**
   * La solicitud que se está aprobando, ENTERA Y NO SUS TEXTOS YA ARMADOS. El diálogo la
   * nombra en tres lugares —el subtítulo de la cabecera, la línea en negrita del aviso azul
   * y el cierre del aviso verde— y los tres salen del mismo objeto: pasarlos como tres
   * strings dejaba que la página los compusiera mal por separado.
   */
  request: WasteSidrepPendingRequest;
  onClose: () => void;
  /**
   * Registra el folio y notifica al transportista. SIN ESTO EL PRIMARIO QUEDA DESHABILITADO
   * en vez de simular la aprobación, mismo criterio que `WasteFolioCloseModal` y
   * `WasteFolioRejectModal`: aprobar mueve la solicitud de bandeja y dispara un correo, así
   * que un botón que dice "Confirmar y notificar" y no hace ninguna de las dos cosas es peor
   * que uno visiblemente apagado.
   */
  onConfirm?: (input: WasteFolioApproveSubmit) => void;
}

export interface WasteFolioApproveSubmit {
  /** N° de folio SIDREP tal como lo devolvió la Ventanilla Única, ya sin espacios. */
  folio: string;
  /** Fecha de generación en ISO `yyyy-mm-dd`, tal como la entrega el `<input type="date">`. */
  generatedOn: string;
}

export function WasteFolioApproveModal({
  open,
  request,
  onClose,
  onConfirm,
}: WasteFolioApproveModalProps) {
  const folioRef = useRef<HTMLInputElement>(null);
  const [folio, setFolio] = useState('');
  const [generatedOn, setGeneratedOn] = useState('');

  /*
   * Cada apertura arranca en blanco, el mismo criterio que el resto de los modales del
   * módulo: un diálogo que recuerda lo tipeado la vez anterior invita a aprobar OTRA
   * solicitud con el folio de la anterior, y ese número es la clave con la que el traslado
   * se sigue después.
   *
   * LA FECHA ARRANCA VACÍA aunque el nodo `3087:17262` dibuje "17/07/2026". Ese valor es la
   * muestra del diseño y no un default —Figma no conoce el día en que se va a aprobar—, y
   * prellenarla con hoy dejaría una fecha que nadie verificó dentro de un registro de
   * fiscalización: la de generación es la que estampó la Ventanilla Única, que puede ser de
   * ayer. Es la misma decisión que ya tomó `WasteFolioCloseModal` con su fecha.
   */
  useEffect(() => {
    if (!open) return undefined;

    setFolio('');
    setGeneratedOn('');
    return undefined;
  }, [open]);

  const subtitle = pendingRequestDetailSubtitle(request);
  const trimmedFolio = folio.trim();
  /*
   * UNA SOLA CONDICIÓN GOBIERNA LAS DOS COSAS QUE CAMBIAN entre los nodos `3087:17238` y
   * `3087:17683`: el primario pasa de `#e2e2e2` a `#c8a064` y aparece el aviso verde. Los
   * dos nodos las dibujan juntas, y tiene sentido que así sea —el estado que habilita la
   * acción es el mismo que habilita la promesa de lo que la acción hace—, así que atarlas a
   * un solo booleano es lo que impide que se separen con el próximo cambio.
   *
   * `onConfirm` entra en la condición Y NO SÓLO EN EL BOTÓN por ese mismo motivo: sin
   * handler no va a pasar nada, y un aviso que promete el cambio de estado al lado de un
   * botón apagado es peor que no mostrarlo.
   */
  const canConfirm = trimmedFolio.length > 0 && generatedOn.length > 0 && onConfirm !== undefined;

  function handleSubmit() {
    if (!canConfirm) return;
    onConfirm?.({ folio: trimmedFolio, generatedOn });
  }

  return (
    <WasteFormModal
      open={open}
      title={WASTE_SIDREP_APPROVE_MODAL.title}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialFocusRef={folioRef}
      actions={
        <>
          <WasteFormModalCancelButton
            label={WASTE_SIDREP_APPROVE_MODAL.cancelLabel}
            onClick={onClose}
          />
          <WasteFolioFooterActionButton
            label={WASTE_SIDREP_APPROVE_MODAL.submitLabel}
            type="submit"
            fullWidth={false}
            icon={(className) => <WasteSinaderMarkDeclaredIcon className={className} />}
            disabled={!canConfirm}
          />
        </>
      }
    >
      {/*
        Aviso `3087:17249`. Las tres líneas van en párrafos separados porque el nodo le
        cambia el peso a la del medio: es el dato a copiar en la otra plataforma, no prosa.
        El `subtitle` que la escribe es el MISMO texto de la cabecera —así lo dibuja el
        diseño— y llega por prop en vez de recomponerse acá.
      */}
      <WasteFormModalNotice>
        <p>{WASTE_SIDREP_APPROVE_MODAL.noticeLead}</p>
        <p className="font-['Inter:Bold',sans-serif] font-bold">{subtitle}</p>
        <p>{WASTE_SIDREP_APPROVE_MODAL.noticeTail}</p>
      </WasteFormModalNotice>

      <WasteFormModalField label={WASTE_SIDREP_APPROVE_MODAL.folioLabel}>
        {(fieldId) => (
          <input
            ref={folioRef}
            id={fieldId}
            type="text"
            value={folio}
            onChange={(event) => setFolio(event.target.value)}
            placeholder={WASTE_SIDREP_APPROVE_MODAL.folioPlaceholder}
            /*
             * `autoComplete="off"`: el folio es un identificador de un traslado y no un dato
             * de la persona, así que el historial del navegador sólo puede ofrecer el de
             * OTRA solicitud.
             */
            autoComplete="off"
            className={WASTE_FORM_MODAL_INPUT_CLASS}
          />
        )}
      </WasteFormModalField>

      <WasteFormModalField label={WASTE_SIDREP_APPROVE_MODAL.dateLabel}>
        {(fieldId) => (
          <WasteFormModalDateInput id={fieldId} value={generatedOn} onChange={setGeneratedOn} />
        )}
      </WasteFormModalField>

      {/*
        Aviso VERDE `3087:17710`, la cuarta fila del cuerpo. APARECE CON EL FORMULARIO
        COMPLETO y no antes: es la diferencia entre los dos nodos del modal, y el `3087:17683`
        lo dibuja con el primario ya dorado, o sea con los dos campos llenos.

        DICE QUÉ VA A PASAR, no qué pasó, y por eso llega recién acá: mientras faltan datos no
        hay nada que prometer. Las dos frases reparten el trabajo —la primera, lo que AurelIA
        hace al confirmar; la segunda, lo que NO hace, que es aceptar el SIDREP por el
        transportista— y esa segunda es la que evita que alguien se quede esperando de este
        lado una aceptación que ocurre en la plataforma del Ministerio.

        El aviso EMPUJA LA TARJETA hacia abajo —de 414.5 a 523.5, lo que miden los dos
        nodos— y el modal se vuelve a centrar solo: el velo lo centra con flex, así que no hay
        alto que recalcular. Los dos nodos lo confirman, cada uno centrado en su propio alto
        sobre el mismo viewport de 1320 × 720.
      */}
      {canConfirm ? (
        <WasteFormModalNotice tone="success">
          <p>
            {WASTE_SIDREP_APPROVE_MODAL.outcomeLead}{' '}
            <span className="font-['Inter:Bold',sans-serif] font-bold">
              {WASTE_SIDREP_APPROVE_OUTCOME_STATUS}
            </span>{' '}
            {pendingRequestApprovalOutcome(request)}
          </p>
          <p>{WASTE_SIDREP_APPROVE_MODAL.outcomeNote}</p>
        </WasteFormModalNotice>
      ) : null}
    </WasteFormModal>
  );
}
