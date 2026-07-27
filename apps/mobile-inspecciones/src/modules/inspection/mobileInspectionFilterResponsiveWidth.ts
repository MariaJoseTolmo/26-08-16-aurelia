import { StyleSheet } from 'react-native';

const FIGMA_FILTER_CONTROL_WIDTH = 323;

// The Figma reference was drawn at 360 dp, where 323 dp was the available
// control width. On wider devices that value must behave as 100% of the
// section content area so the 14 dp horizontal padding remains consistent.
StyleSheet.setStyleAttributePreprocessor('maxWidth', (value) => (
  value === FIGMA_FILTER_CONTROL_WIDTH ? '100%' : value
));
