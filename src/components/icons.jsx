import React from 'react';

/* Lightweight inline icon set (Feather/Lucide style, no runtime dependency). */
function Icon({ size = 18, children, strokeWidth = 2, fill = 'none', ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p) => (<Icon {...p}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M9 21v-6h6v6" /></Icon>);
export const LightbulbIcon = (p) => (<Icon {...p}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" /></Icon>);
export const CalendarIcon = (p) => (<Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>);
export const UserIcon = (p) => (<Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>);
export const UsersIcon = (p) => (<Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 21a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3.5 3.5 0 0 1 0 5" /><path d="M17 21a6.5 6.5 0 0 0-2-4.6" /></Icon>);
export const VoteIcon = (p) => (<Icon {...p}><path d="m9 12 2 2 4-4" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2Z" /></Icon>);
export const BarChartIcon = (p) => (<Icon {...p}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></Icon>);
export const LayoutIcon = (p) => (<Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></Icon>);
export const MessageIcon = (p) => (<Icon {...p}><path d="M21 11.5a8.38 8.38 0 0 1-9 8.4L3 21l1.1-3.3A8.38 8.38 0 1 1 21 11.5Z" /></Icon>);
export const SettingsIcon = (p) => (<Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.81.99V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 15H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 11 3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 9v.09c.99.36 1.5.9 1.5 1.91s-.51 1.55-1.5 1.91Z" /></Icon>);
export const PlusIcon = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>);
export const PlusCircleIcon = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></Icon>);
export const SendIcon = (p) => (<Icon {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></Icon>);
export const MapPinIcon = (p) => (<Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></Icon>);
export const LogOutIcon = (p) => (<Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Icon>);
export const InfoIcon = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></Icon>);
export const CheckIcon = (p) => (<Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>);
export const CheckCircleIcon = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-4.5" /></Icon>);
export const XIcon = (p) => (<Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>);
export const HeartIcon = (p) => (<Icon {...p}><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1Z" /></Icon>);
export const StarIcon = (p) => (<Icon {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" /></Icon>);
export const TrendingIcon = (p) => (<Icon {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></Icon>);
export const SparkleIcon = (p) => (<Icon {...p} fill="currentColor" stroke="none"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></Icon>);
export const SearchIcon = (p) => (<Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>);
export const TrashIcon = (p) => (<Icon {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></Icon>);
export const MenuIcon = (p) => (<Icon {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Icon>);
export const ClockIcon = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>);
export const ArrowRightIcon = (p) => (<Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>);
export const ArrowLeftIcon = (p) => (<Icon {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></Icon>);
export const LayersIcon = (p) => (<Icon {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></Icon>);
export const TicketIcon = (p) => (<Icon {...p}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" /><path d="M13 6v12" /></Icon>);
export const RefreshIcon = (p) => (<Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icon>);

export const LogoMark = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l2.6 6.4L21 10l-5.2 4.4L17 21l-5-3.4L7 21l1.2-6.6L3 10l6.4-.6L12 3Z" fill="#fff" />
  </svg>
);
