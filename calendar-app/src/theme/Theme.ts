import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes based on standard mobile device (e.g. iPhone 13)
const guidelineBaseWidth = 390;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

export const Colors = {
  background: '#EBEBE6',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#8E8E93',
  primary: '#333333',
  secondary: '#DCDCD8',
  white: '#FFFFFF',
  black: '#000000',
  placeholder: '#A8A8A8',
  error: '#FF3B30',
  
  // Design System Color Pairs
  cards: [
    { bg: '#DDA76A', text: '#3E2A14' }, 
    { bg: '#B2B9BB', text: '#2D3A31' }, 
    { bg: '#C2B6D6', text: '#3D2D50' }, 
    { bg: '#D6A6A6', text: '#502D2D' }, 
    { bg: '#A6D6D2', text: '#2D504D' }, 
    { bg: '#D6D6A6', text: '#4D502D' }, 
  ],

  // Individual colors for backward compatibility
  cardMustard: '#DDA76A',
  accentMustard: '#3E2A14',
  cardGray: '#B2B9BB',
  cardLavender: '#C2B6D6',
  cardPink: '#D6A6A6',
  cardTeal: '#A6D6D2',
  cardGreen: '#D6D6A6',
};

export const Spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(20),
  xl: scale(30),
  xxl: scale(40),
};

export const BorderRadius = {
  sm: scale(8),
  md: scale(12),
  lg: scale(20),
  xl: scale(30),
  round: scale(50),
};

export const Typography = {
  h1: {
    fontSize: scale(48),
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: scale(34),
    fontWeight: '900' as const,
  },
  h3: {
    fontSize: scale(28),
    fontWeight: '800' as const,
  },
  title: {
    fontSize: scale(20),
    fontWeight: '800' as const,
  },
  body: {
    fontSize: scale(16),
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: scale(14),
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  small: {
    fontSize: scale(12),
    fontWeight: '800' as const,
  }
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
