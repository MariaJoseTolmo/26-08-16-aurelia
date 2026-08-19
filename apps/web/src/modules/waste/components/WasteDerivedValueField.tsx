/**
 * Dato que TRANSCRIBE UN DOCUMENTO, en sus dos estados — cuatro nodos, un solo campo:
 *
 *   `4230:10657` → `4085:77290`  los tres pesos de "Peso del residuo", del ticket de pesaje
 *   `4230:13438` → `4230:13650`  ticket y kg recibidos de "Registrar cierre de folio",
 *                                de la declaración SIDREP
 *
 * ES EL MISMO CAMPO Y NO DOS PARECIDOS: los cuatro nodos coinciden en la caja, en el
 * padding, en las dos paletas y en las dos tipografías del valor. Lo que cambia entre las
 * dos pantallas es qué documento se sube y qué dato transcribe.
 *
 * EL ESTADO LO DECIDE EL VALOR Y NO EL ARCHIVO, y eso es deliberado: con el documento
 * subido pero la lectura fallada o en curso, el campo sigue PENDIENTE. Mostrarlo
 * transcrito porque hay archivo diría algo que todavía no es cierto.
 *
 * Geometría del design context:
 *
 *   caja        rounded-[8px] · border · px-[17px] py-[17.5px]
 *               flex items-center justify-between
 *   PENDIENTE   bg #f7f7f7 · border #e3e3e3
 *               rótulo Inter Semi Bold 11.5px #646464
 *               valor  Inter Regular   10.5px #646464 · a la derecha
 *   TRANSCRITO  bg #e6f3ff · border #c5d8f0
 *               rótulo Inter Semi Bold 11.5px #0d3862
 *               valor  Inter BOLD      19px   #0d3862
 *
 * NINGUNO DE LOS DOS TEXTOS LLEVA `whitespace-nowrap`, y los anchos del nodo no se fijan.
 * El nodo mide el rótulo en 87px y el mensaje pendiente en 110 —los dos en dos líneas— y
 * ésos son anchos MEDIDOS de texto que hugea, no cajas del diseño: de hecho el mismo
 * mensaje mide distinto en las dos cajas del modal. Con los dos al tamaño de su contenido
 * y `justify-between`, cada uno se parte donde el nodo lo parte y el alto de 63px sale
 * solo. El valor transcrito SÍ va `nowrap`: una cifra de 19px no se corta en dos líneas.
 */
interface WasteDerivedValueFieldProps {
  label: string;
  /** El dato ya formateado con su unidad, o `null` mientras no hay lectura. */
  value: string | null;
  /** Qué se escribe en lugar del valor: "Se requiere declaración SIDREP", "Analizando…". */
  pendingLabel: string;
}

export function WasteDerivedValueField({
  label,
  value,
  pendingLabel,
}: WasteDerivedValueFieldProps) {
  const isRead = value !== null;

  return (
    <div
      className={`flex min-w-px flex-1 items-center justify-between gap-[8px] rounded-[8px] border border-solid px-[17px] py-[17.5px] ${
        isRead ? 'border-[#c5d8f0] bg-[#e6f3ff]' : 'border-[#e3e3e3] bg-[#f7f7f7]'
      }`}
      data-name="Container"
    >
      <p
        className={`font-['Inter:Semi_Bold',sans-serif] text-[11.5px] font-semibold not-italic leading-[normal] ${
          isRead ? 'text-[#0d3862]' : 'text-[#646464]'
        }`}
      >
        {label}
      </p>
      {isRead ? (
        <p className="shrink-0 whitespace-nowrap font-['Inter:Bold',sans-serif] text-[19px] font-bold not-italic leading-[normal] text-[#0d3862]">
          {value}
        </p>
      ) : (
        <p className="text-right font-['Inter:Regular',sans-serif] text-[10.5px] font-normal not-italic leading-[normal] text-[#646464]">
          {pendingLabel}
        </p>
      )}
    </div>
  );
}
