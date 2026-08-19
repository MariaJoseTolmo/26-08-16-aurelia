export function LocationWidget({ captured, label, accuracy, capturing, resolved, onCapture }: { captured: boolean; label: string; accuracy: string; capturing: boolean; resolved: boolean; onCapture: () => void }) {
  const buttonClass = captured ? 'bg-[#3A9B3A]' : 'bg-[#C8A064]';
  return (
    <div className="mb-[10px] ml-[33px] mr-[12px] rounded-[12px] border border-[#E3E3E3] bg-white p-[12px]">
      <p className="text-[12px] font-bold text-[#131313]">Ubicación de la inspección</p>
      <p className="mt-[8px] text-[11px] leading-[17px] text-[#646464]">La ubicación es obligatoria para continuar.</p>
      <button type="button" className={`mt-[8px] h-[44px] w-full rounded-[10px] text-[12px] font-bold text-white ${buttonClass}`} onClick={onCapture} disabled={capturing || resolved}>{capturing ? 'Capturando ubicación...' : captured ? 'Ubicación capturada' : 'Capturar ubicación'}</button>
      <div className="mt-[8px] rounded-[8px] border border-[#E3E3E3] bg-[#F4F6F9] px-[12px] py-[8px]">
        <p className="text-[11px] font-semibold text-[#131313]">{label}</p>
        <p className="mt-[2px] text-[10px] text-[#646464]">{accuracy}</p>
      </div>
    </div>
  );
}
