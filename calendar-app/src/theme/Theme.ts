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
  
  // Design System Color Pairs (Background & Corresponding Dark Text)
  cards: [
    { bg: '#DDA76A', text: '#3E2A14' }, // Mustard
    { bg: '#B2B9BB', text: '#2D3A31' }, // Gray
    { bg: '#C2B6D6', text: '#3D2D50' }, // Lavender
    { bg: '#D6A6A6', text: '#502D2D' }, // Pink
    { bg: '#A6D6D2', text: '#2D504D' }, // Teal
    { bg: '#D6D6A6', text: '#4D502D' }, // Green
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 30,
  xxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  round: 50,
};

export const Typography = {
  h1: {
    fontSize: 48,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 34,
    fontWeight: '900' as const,
  },
  h3: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  small: {
    fontSize: 12,
    fontWeight: '800' as const,
  }
};
