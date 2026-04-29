import { create } from 'zustand';

interface AlertButton {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

interface AlertState {
  isVisible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  show: (title: string, message: string, buttons?: AlertButton[]) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  title: '',
  message: '',
  buttons: [],
  show: (title, message, buttons = [{ text: 'Đồng ý', variant: 'primary' }]) => {
    set({ isVisible: true, title, message, buttons });
  },
  hide: () => set({ isVisible: false }),
}));
