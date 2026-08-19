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
  const isCompactSlaIndicator = className.includes('h-[9px]') && className.includes('w-[11.25px]');
  if (isCompactSlaIndicator) {
    const slaColor = status === 'open' ? '#532A0E' : '#570B1D';
    return (
      <svg className={className} width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
        <path d="M5.625 9C4.43153 9 3.28693 8.52589 2.44302 7.68198C1.59911 6.83807 1.125 5.69347 1.125 4.5C1.125 3.30653 1.59911 2.16193 2.44302 1.31802C3.28693 0.474106 4.43153 0 5.625 0C6.81847 0 7.96307 0.474106 8.80698 1.31802C9.65089 2.16193 10.125 3.30653 10.125 4.5C10.125 5.69347 9.65089 6.83807 8.80698 7.68198C7.96307 8.52589 6.81847 9 5.625 9ZM5.625 5.625C5.47582 5.625 5.33274 5.68426 5.22725 5.78975C5.12176 5.89524 5.0625 6.03832 5.0625 6.1875C5.0625 6.33668 5.12176 6.47976 5.22725 6.58525C5.33274 6.69074 5.47582 6.75 5.625 6.75C5.77418 6.75 5.91726 6.69074 6.02275 6.58525C6.12824 6.47976 6.1875 6.33668 6.1875 6.1875C6.1875 6.03832 6.12824 5.89524 6.02275 5.78975C5.91726 5.68426 5.77418 5.625 5.625 5.625ZM5.625 2.25C5.30508 2.25 5.0502 2.52246 5.07305 2.84238L5.20312 4.67051C5.21895 4.89199 5.40352 5.0625 5.62324 5.0625C5.84473 5.0625 6.02754 4.89199 6.04336 4.67051L6.17344 2.84238C6.19629 2.52246 5.94316 2.25 5.62148 2.25H5.625Z" fill={slaColor} />
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
      <path d="M3.25 0C2.35371 0 1.625 0.728711 1.625 1.625V11.375C1.625 12.2713 2.35371 13 3.25 13H5.28125V10.1562C5.28125 9.25996 6.00996 8.53125 6.90625 8.53125H11.375V4.3291C11.375 3.89746 11.2049 3.48359 10.9002 3.17891L8.19355 0.474805C7.88887 0.170117 7.47754 0 7.0459 0H3.25ZM9.88965 4.46875H7.51562C7.17793 4.46875 6.90625 4.19707 6.90625 3.85938V1.48535L9.88965 4.46875ZM6.90625 9.64844C6.62695 9.64844 6.39844 9.87695 6.39844 10.1562V13.4062C6.39844 13.6855 6.62695 13.9141 6.90625 13.9141C7.18555 13.9141 7.41406 13.6855 7.41406 13.4062V12.6953H7.71875C8.55918 12.6953 9.24219 12.0123 9.24219 11.1719C9.24219 10.3314 8.55918 9.64844 7.71875 9.64844H6.90625ZM7.71875 11.6797H7.41406V10.6641H7.71875C7.99805 10.6641 8.22656 10.8926 8.22656 11.1719C8.22656 11.4512 7.99805 11.6797 7.71875 11.6797ZM10.1562 9.64844C9.87695 9.64844 9.64844 9.87695 9.64844 10.1562V13.4062C9.64844 13.6855 9.87695 13.9141 10.1562 13.9141H10.9688C11.6975 13.9141 12.2891 13.3225 12.2891 12.5938V10.9688C12.2891 10.24 11.6975 9.64844 10.9688 9.64844H10.1562ZM10.6641 12.8984V10.6641H10.9688C11.1363 10.6641 11.2734 10.8012 11.2734 10.9688V12.5938C11.2734 12.7613 11.1363 12.8984 10.9688 12.8984H10.6641ZM12.8984 10.1562V13.4062C12.8984 13.6855 13.127 13.9141 13.4062 13.9141C13.6855 13.9141 13.9141 13.6855 13.9141 13.4062V12.2891H14.625C14.9043 12.2891 15.1328 12.0605 15.1328 11.7812C15.1328 11.502 14.9043 11.2734 14.625 11.2734H13.9141V10.6641H14.625C14.9043 10.6641 15.1328 10.4355 15.1328 10.1562C15.1328 9.87695 14.9043 9.64844 14.625 9.64844H13.4062C13.127 9.64844 12.8984 9.87695 12.8984 10.1562Z" fill="#333333" />
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
      <path d="M4.29316 1.72012C4.0002 1.42715 3.52441 1.42715 3.23145 1.72012C2.93848 2.01309 2.93848 2.48887 3.23145 2.78184L6.45176 5.9998L3.23379 9.22012C2.94082 9.51309 2.94082 9.98887 3.23379 10.2818C3.52676 10.5748 4.00254 10.5748 4.29551 10.2818L7.51348 7.06152L10.7338 10.2795C11.0268 10.5725 11.5025 10.5725 11.7955 10.2795C12.0885 9.98652 12.0885 9.51074 11.7955 9.21777L8.5752 5.9998L11.7932 2.77949C12.0861 2.48652 12.0861 2.01074 11.7932 1.71777C11.5002 1.4248 11.0244 1.4248 10.7314 1.71777L7.51348 4.93809L4.29316 1.72012Z" fill="#570B1D" />
    </svg>
  );
}

export function InspectionDetailApproveIcon({ className = 'h-[12px] w-[15px]' }: IconProps) {
  return (
    <svg className={className} width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <path d="M12.44 1.64267C12.7752 1.88642 12.8502 2.35517 12.6064 2.69033L6.60645 10.9403C6.47754 11.1185 6.27832 11.2286 6.05801 11.2474C5.8377 11.2661 5.62441 11.1841 5.46973 11.0294L2.46973 8.02939C2.17676 7.73642 2.17676 7.26064 2.46973 6.96767C2.7627 6.6747 3.23848 6.6747 3.53145 6.96767L5.91035 9.34658L11.3947 1.80674C11.6385 1.47158 12.1072 1.39658 12.4424 1.64033L12.44 1.64267Z" fill="white" />
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
