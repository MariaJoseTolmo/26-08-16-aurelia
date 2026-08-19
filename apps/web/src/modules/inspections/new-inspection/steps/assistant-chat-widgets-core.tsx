import type { ReactNode } from 'react';

export function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] flex w-full items-end gap-[7px]">
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#CAA262] text-[11px] text-[#001E39]">✦</div>
      <div className="max-w-[85%] rounded-[16px] rounded-bl-[4px] border border-[#E3E3E3] bg-white px-[12px] py-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div>{children}</div>
        <p className="mt-[6px] text-[11px] text-[#99A0AF]">{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] ml-auto max-w-[78%] rounded-[16px] rounded-br-[4px] bg-[#002659] px-[12px] py-[10px]">
      <div className="text-[13px] font-medium leading-[18px] text-white">{children}</div>
      <p className="mt-[6px] text-[11px] text-[rgba(255,255,255,0.38)]">{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="mb-[10px] flex w-full items-end gap-[7px]">
      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#CAA262] text-[11px] text-[#001E39]">✦</div>
      <div className="inline-flex items-center gap-[4px] rounded-[14px] rounded-bl-[4px] border border-[#D3D7DE] bg-white px-[14px] py-[10px]">
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF]" />
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]" />
        <span className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function ErrorBubble({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-[10px] ml-[33px] rounded-[12px] border border-[#F3A7B8] bg-[#FFD4E0] px-[12px] py-[10px] text-[#7A0E23]">
      <p className="text-[12px] font-semibold">{message}</p>
      {onRetry ? <button type="button" className="mt-[8px] rounded-[8px] bg-white px-[10px] py-[6px] text-[11px] font-bold" onClick={onRetry}>Reintentar</button> : null}
    </div>
  );
}
