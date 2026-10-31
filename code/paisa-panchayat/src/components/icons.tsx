/** Line icons for navigation and controls. Category and goal pictures stay as big emoji. */
import type { ReactNode } from "react";

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const HomeIcon = () => <Svg><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5V14h4v5.5" /></Svg>;
export const GoalIcon = () => <Svg><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></Svg>;
export const PanchayatIcon = () => <Svg><path d="M12 4v16" /><path d="M7.5 20h9" /><path d="M5 7h14" /><path d="m5 7-2.5 6.5a3 3 0 0 0 5 0L5 7Z" /><path d="m19 7-2.5 6.5a3 3 0 0 0 5 0L19 7Z" /></Svg>;
export const BellIcon = () => <Svg><path d="M6 10a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10Z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></Svg>;
export const ChatIcon = ({ size = 28 }: { size?: number }) => <Svg size={size}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5v-8Z" /><path d="M8.5 9h7M8.5 12.5h4.5" /></Svg>;
export const SendIcon = () => <Svg size={20}><path d="M12 19V5" /><path d="m5.5 11.5 6.5-6.5 6.5 6.5" /></Svg>;
export const RulingIcon = () => <Svg size={20}><path d="m14 5 5 5" /><path d="m11 8 5 5" /><path d="m12.5 6.5 5 5-3 3-5-5 3-3Z" /><path d="m10 12-6 6" /><path d="M13 20h7" /></Svg>;
export const CloseIcon = () => <Svg size={20}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const MicIcon = () => <Svg size={20}><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" /><path d="M12 18v2.5" /></Svg>;
export const LedgerIcon = () => <Svg><path d="M6 4h12a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4Z" /><path d="M9 4v16" /><path d="M12.5 9h4M12.5 13h4" /></Svg>;
export const PlusIcon = () => <Svg size={22}><path d="M12 5v14M5 12h14" /></Svg>;
export const ReceiptIcon = () => <Svg><path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z" /><path d="M9.5 8h5M9.5 12h5" /></Svg>;
export const WaveIcon = () => <Svg size={20}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M8 10.5v3M11 8.5v7M14 9.5v5M17 11v2" /></Svg>;
