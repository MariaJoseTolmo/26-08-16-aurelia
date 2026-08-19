export const colors = {
  // Brand
  navy: '#001E39',
  navyDark: '#002659',
  gold: '#C8A064',
  goldDark: '#8E6E3E',
  goldHover: '#D4AE7A',

  // Semantic
  teal: '#00B398',
  tealSurf: '#C5FFF6',
  tealTxt: '#006153',
  blueLink: '#24588B',
  blueSurf: '#E6F3FF',
  blueTxt: '#0D3862',
  success: '#6CC24A',
  successSurf: '#E0FFD3',
  successTxt: '#2A5C16',
  warnSurf: '#FFEAB8',
  warnTxt: '#463100',
  danger: '#BD3B5B',
  dangerSurf: '#FFD0DB',
  dangerTxt: '#570B1D',
  ocreSurf: '#FFE1CD',
  ocreTxt: '#532A0E',

  // Neutrals
  white: '#FFFFFF',
  surface: '#F4F6F9',
  border: '#E3E3E3',
  borderMid: '#D1D1D1',
  placeholder: '#ACACAC',
  muted: '#646464',
  body: '#333333',
  primary: '#131313',
  ok: '#3A9B3A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  base: 13,
  lg: 14,
  xl: 16,
  xxl: 20,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};
