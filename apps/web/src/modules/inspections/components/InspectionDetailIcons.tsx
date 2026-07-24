export type InspectionDetailIconStatus = 'executed' | 'open' | 'closed' | 'rejected';

type IconProps = {
  className?: string;
};

type StatusIconProps = IconProps & {
  status: InspectionDetailIconStatus;
};

const statusColors: Record<InspectionDetailIconStatus, string> = {
  executed: '#570B1D',
  open: '#463100',
  closed: '#2A5C16',
  rejected: '#646464',
};

export function InspectionDetailCloseIcon({ className = 'size-[32px]' }: IconProps) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M7.5 7.5L24.5 24.5M24.5 7.5L7.5 24.5" stroke="#131313" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function InspectionDetailCaretDownIcon({ className = 'size-[16px]' }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.15 5.7C2.78 5.26 3.09 4.58 3.67 4.58H12.33C12.91 4.58 13.22 5.26 12.85 5.7L8.52 10.9C8.25 11.23 7.75 11.23 7.48 10.9L3.15 5.7Z" fill="#131313" />
    </svg>
  );
}

export function InspectionDetailStatusChipIcon({ status, className = 'h-[6px] w-[7.5px]' }: StatusIconProps) {
  return (
    <svg className={className} width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
      <circle cx="3.75" cy="3" r="3" fill={statusColors[status]} />
    </svg>
  );
}

export function InspectionDetailStatusRowIcon({ status, className = 'h-[11px] w-[13.75px]' }: StatusIconProps) {
  const color = statusColors[status];
  const isClosedSlaIndicator = status === 'open' && className.includes('h-[9px]') && className.includes('w-[11.25px]');
  if (isClosedSlaIndicator) {
    return (
      <svg className={className} width="11.25" height="9" viewBox="0 0 11.25 9" fill="none" aria-hidden="true">
        <circle cx="4.5" cy="4.5" r="4.5" fill="#532A0E" />
        <path d="M4.5 2.05V5.05" stroke="white" strokeWidth="1.05" strokeLinecap="round" />
        <circle cx="4.5" cy="6.62" r="0.62" fill="white" />
      </svg>
    );
  }
  if (status === 'closed') {
    return (
      <svg className={className} width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="5.5" r="5.5" fill={color} />
        <path d="M3.15 5.55L4.75 7.15L8.35 3.65" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'open') {
    return (
      <svg className={className} width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="5.5" r="5.5" fill={color} />
        <path d="M5.5 2.55V5.5L7.55 6.65" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="5.5" fill={color} />
      <path d="M5.5 2.4V5.8" stroke="white" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="5.5" cy="8" r="0.7" fill="white" />
    </svg>
  );
}

export function InspectionDetailPdfIcon({ className = 'h-[13px] w-[16.25px]' }: IconProps) {
  return (
    <svg className={className} width="17" height="14" viewBox="0 0 17 14" fill="none" aria-hidden="true">
      <path d="M4.25 1.25H9.65L12.75 4.4V12.75H4.25V1.25Z" fill="#333333" />
      <path d="M9.65 1.25V4.4H12.75" stroke="white" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M5.35 10.75V7.75H6.55C7.18 7.75 7.62 8.17 7.62 8.78C7.62 9.39 7.18 9.8 6.55 9.8H6.05V10.75H5.35ZM6.05 9.2H6.46C6.72 9.2 6.9 9.03 6.9 8.78C6.9 8.52 6.72 8.35 6.46 8.35H6.05V9.2Z" fill="white" />
      <path d="M7.95 10.75V7.75H9.05C9.93 7.75 10.5 8.35 10.5 9.25C10.5 10.15 9.93 10.75 9.05 10.75H7.95ZM8.65 10.12H9.01C9.49 10.12 9.78 9.8 9.78 9.25C9.78 8.7 9.49 8.38 9.01 8.38H8.65V10.12Z" fill="white" />
      <path d="M10.82 10.75V7.75H12.75V8.37H11.52V8.97H12.58V9.58H11.52V10.75H10.82Z" fill="white" />
    </svg>
  );
}

export function InspectionDetailImageIcon({ className = 'h-[18px] w-[22.5px]', tone = '#24588B' }: IconProps & { tone?: string }) {
  return (
    <svg className={className} width="23" height="18" viewBox="0 0 23 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="1" width="20" height="16" rx="2.5" fill={tone} />
      <circle cx="7.2" cy="6" r="2" fill="white" />
      <path d="M4.3 14.2L9.1 9.6L12.2 12.4L15.3 8.8L19.2 14.2H4.3Z" fill="white" />
    </svg>
  );
}

export function InspectionDetailRejectIcon({ className = 'h-[12px] w-[15px]' }: IconProps) {
  return (
    <svg className={className} width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <path d="M3.75 2.25L11.25 9.75M11.25 2.25L3.75 9.75" stroke="#570B1D" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function InspectionDetailApproveIcon({ className = 'h-[12px] w-[15px]' }: IconProps) {
  return (
    <svg className={className} width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <path d="M3.1 6.2L6.15 9.25L11.9 2.75" stroke="white" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InspectionDetailFollowupIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <circle cx="3" cy="2.25" r="2" fill="#24588B" />
      <circle cx="11" cy="2.25" r="2" fill="#24588B" />
      <circle cx="7" cy="8.5" r="2" fill="#24588B" />
      <path d="M3 4.25V5.5C3 6.05 3.45 6.5 4 6.5H6.05M11 4.25V5.5C11 6.05 10.55 6.5 10 6.5H7.95M5 2.25H9" stroke="#24588B" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InspectionDetailPersonIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <circle cx="6.25" cy="2.45" r="1.75" fill="#646464" />
      <path d="M3.2 8.85C3.55 6.9 4.62 5.75 6.25 5.75C7.88 5.75 8.95 6.9 9.3 8.85H3.2Z" fill="#646464" />
      <path d="M4.85 1.15L6.25 0.3L7.65 1.15" stroke="#646464" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InspectionDetailLocationIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M1.4 1.35L4.25 0.55L8.05 1.35L11.6 0.45V8.65L8.05 9.55L4.25 8.75L1.4 9.55V1.35Z" fill="#646464" />
      <path d="M4.25 0.7V8.75M8.05 1.35V9.4" stroke="white" strokeOpacity="0.75" strokeWidth="0.7" />
      <circle cx="8.05" cy="4.2" r="1.35" fill="white" />
      <path d="M8.05 7.1C8.05 7.1 10.15 5.25 10.15 3.85C10.15 2.72 9.2 1.8 8.05 1.8C6.9 1.8 5.95 2.72 5.95 3.85C5.95 5.25 8.05 7.1 8.05 7.1Z" fill="#646464" />
    </svg>
  );
}

export function InspectionDetailCameraIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M3.95 1.2L4.75 0.25H8.25L9.05 1.2H11.25C11.92 1.2 12.45 1.74 12.45 2.4V8.25C12.45 8.91 11.92 9.45 11.25 9.45H1.25C0.58 9.45 0.05 8.91 0.05 8.25V2.4C0.05 1.74 0.58 1.2 1.25 1.2H3.95Z" fill="#646464" />
      <circle cx="6.25" cy="5.3" r="2.3" fill="white" />
      <circle cx="6.25" cy="5.3" r="1.35" fill="#646464" />
    </svg>
  );
}

export function InspectionDetailListIcon({ className = 'h-[10px] w-[12.5px]' }: IconProps) {
  return (
    <svg className={className} width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M1.15 2.1L2.05 3L3.75 1.2M1.15 5.1L2.05 6L3.75 4.2M1.15 8.1L2.05 9L3.75 7.2" stroke="#646464" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.1 2.2H11.8M5.1 5.2H11.8M5.1 8.2H11.8" stroke="#646464" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function InspectionDetailChecklistListIcon({ className = 'h-[11px] w-[13.75px]' }: IconProps) {
  return (
    <svg className={className} width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path d="M1.38 2.04L2.07 2.73L3.44 1.21M1.38 5.49L2.07 6.18L3.44 4.66M1.38 8.94L2.07 9.63L3.44 8.11" stroke="#24588B" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.16 2.08H12.38M5.16 5.53H12.38M5.16 8.98H12.38" stroke="#24588B" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export function InspectionDetailChecklistYesIcon({ className = 'h-[9px] w-[11.25px]' }: IconProps) {
  return (
    <svg className={className} width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
      <path d="M1.3 4.58L4.23 7.45L10.1 1.38" stroke="#2A5C16" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InspectionDetailChecklistNoIcon({ className = 'h-[9px] w-[11.25px]' }: IconProps) {
  return (
    <svg className={className} width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
      <path d="M2.3 1.42L9.15 7.58M9.15 1.42L2.3 7.58" stroke="#570B1D" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

export function InspectionDetailAssignIcon({ className = 'h-[12px] w-[15px]' }: IconProps) {
  return (
    <svg className={className} width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <circle cx="5" cy="4" r="2.1" fill="#24588B" />
      <path d="M1.35 10.5C1.78 7.95 3.05 6.65 5 6.65C6.95 6.65 8.22 7.95 8.65 10.5H1.35Z" fill="#24588B" />
      <path d="M10.2 3.25H13.55M11.88 1.58V4.92" stroke="#24588B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
