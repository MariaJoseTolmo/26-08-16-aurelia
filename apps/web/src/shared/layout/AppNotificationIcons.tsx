type IconProps = {
  className?: string;
  tone?: string;
};

export function NotificationCloseIcon({ className = 'size-[32px]', tone = 'white' }: IconProps) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 8L24 24M24 8L8 24" stroke={tone} strokeWidth="2" strokeLinecap="round" /></svg>;
}

export function NotificationAssignedIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><rect x="3" y="1.5" width="14" height="13" rx="2" fill="#24588B" /><path d="M7 5.1H13M7 8H13M7 10.9H11" stroke="white" strokeWidth="1.3" strokeLinecap="round" /><circle cx="5.6" cy="5.1" r="0.65" fill="white" /><circle cx="5.6" cy="8" r="0.65" fill="white" /><circle cx="5.6" cy="10.9" r="0.65" fill="white" /></svg>;
}

export function NotificationExecutedIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><circle cx="10" cy="8" r="7" fill="#006153" /><path d="M6.4 8.2L8.7 10.5L13.8 5.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NotificationApprovedIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><path d="M10 1.5L12 3.2L14.6 2.9L15.1 5.5L17.2 7L15.9 9.3L16.6 11.8L14 12.6L12.8 14.9L10 13.9L7.2 14.9L6 12.6L3.4 11.8L4.1 9.3L2.8 7L4.9 5.5L5.4 2.9L8 3.2L10 1.5Z" fill="#2A5C16" /><path d="M6.7 8.1L9 10.3L13.4 5.7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NotificationRejectedIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><circle cx="10" cy="8" r="7" fill="#570B1D" /><path d="M7.2 5.2L12.8 10.8M12.8 5.2L7.2 10.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export function NotificationResentIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><path d="M15.2 5.4C14.2 3.3 12.1 2 9.7 2C7.2 2 5.1 3.4 4.1 5.4" stroke="#463100" strokeWidth="1.9" strokeLinecap="round" /><path d="M15.2 5.4V2.6M15.2 5.4H12.4" stroke="#463100" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M4.8 10.6C5.8 12.7 7.9 14 10.3 14C12.8 14 14.9 12.6 15.9 10.6" stroke="#463100" strokeWidth="1.9" strokeLinecap="round" /><path d="M4.8 10.6V13.4M4.8 10.6H7.6" stroke="#463100" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NotificationInspectionClosedIcon({ className = 'h-[16px] w-[20px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 20 16" fill="none" aria-hidden="true"><path d="M5.2 2V14" stroke="#2A5C16" strokeWidth="1.6" strokeLinecap="round" /><path d="M5.2 3.1H14.3L12.8 5.7L14.3 8.3H5.2V3.1Z" fill="#2A5C16" /><path d="M7.1 5.7L8.5 7L11.7 4.3" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NotificationSearchIcon({ className = 'h-[9px] w-[11.25px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true"><circle cx="4.4" cy="4" r="2.6" stroke="#24588B" strokeWidth="1.4" /><path d="M6.4 5.8L9.4 8" stroke="#24588B" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

export function NotificationListIcon({ className = 'h-[9px] w-[11.25px]', tone = '#646464' }: IconProps) {
  return <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true"><path d="M1.2 2H2M1.2 4.5H2M1.2 7H2M4 2H10.5M4 4.5H10.5M4 7H10.5" stroke={tone} strokeWidth="1.2" strokeLinecap="round" /></svg>;
}

export function NotificationEyeIcon({ className = 'h-[9px] w-[11.25px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true"><path d="M1 4.5C2.2 2.5 3.9 1.5 6 1.5C8.1 1.5 9.8 2.5 11 4.5C9.8 6.5 8.1 7.5 6 7.5C3.9 7.5 2.2 6.5 1 4.5Z" fill="#646464" /><circle cx="6" cy="4.5" r="1.4" fill="white" /></svg>;
}

export function NotificationClockIcon({ className = 'h-[9px] w-[11.25px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 12 9" fill="none" aria-hidden="true"><circle cx="5.5" cy="4.5" r="3.8" stroke="#ACACAC" strokeWidth="1" /><path d="M5.5 2.4V4.7L7.1 5.6" stroke="#ACACAC" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function NotificationChecklistIcon({ className = 'h-[9px] w-[9px]' }: IconProps) {
  return <svg className={className} viewBox="0 0 9 9" fill="none" aria-hidden="true"><rect x="1" y="0.7" width="7" height="7.6" rx="1" fill="#24588B" /><path d="M3 3.2L3.7 3.9L5.2 2.4M3 6L3.7 6.7L5.2 5.2" stroke="white" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
