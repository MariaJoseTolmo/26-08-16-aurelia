import React, { type PropsWithChildren, useCallback, useMemo, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

const DEFAULT_BASE_WIDTH = 360;
const DEFAULT_MIN_SCALE = 0.85;
const DEFAULT_MAX_SCALE = 1.15;

type ViewportSize = {
  width: number;
  height: number;
};

type DesignViewportProps = PropsWithChildren<{
  baseWidth?: number;
  minScale?: number;
  maxScale?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}>;

export function resolveDesignViewportScale(
  width: number,
  baseWidth = DEFAULT_BASE_WIDTH,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
): number {
  if (!Number.isFinite(width) || width <= 0) return 1;
  if (!Number.isFinite(baseWidth) || baseWidth <= 0) return 1;

  const safeMinimum = Number.isFinite(minScale) && minScale > 0 ? minScale : DEFAULT_MIN_SCALE;
  const safeMaximum = Number.isFinite(maxScale) && maxScale >= safeMinimum
    ? maxScale
    : Math.max(safeMinimum, DEFAULT_MAX_SCALE);

  return Math.min(safeMaximum, Math.max(safeMinimum, width / baseWidth));
}

export function DesignViewport({
  children,
  baseWidth = DEFAULT_BASE_WIDTH,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  style,
  testID,
}: DesignViewportProps) {
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) => (
      Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
        ? current
        : { width, height }
    ));
  }, []);

  const scale = useMemo(
    () => resolveDesignViewportScale(viewport.width, baseWidth, minScale, maxScale),
    [baseWidth, maxScale, minScale, viewport.width],
  );

  const canvasStyle = useMemo<ViewStyle | null>(() => {
    if (viewport.width <= 0 || viewport.height <= 0) return null;

    return {
      width: viewport.width / scale,
      height: viewport.height / scale,
      transformOrigin: 'left top',
      transform: [{ scale }],
    };
  }, [scale, viewport.height, viewport.width]);

  return (
    <View testID={testID} style={[styles.host, style]} onLayout={handleLayout}>
      {canvasStyle ? <View style={canvasStyle}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
});
