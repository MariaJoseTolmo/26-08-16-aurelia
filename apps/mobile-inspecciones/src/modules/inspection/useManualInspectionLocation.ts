import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { formatAccuracyLabel, formatLocationLabel } from '../../shared/utils/geo.utils';
import { useManualInspectionDraft } from './manualInspection.store';

export function useManualInspectionLocation() {
  const setLocation = useManualInspectionDraft((state) => state.setLocation);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    setCapturing(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setError('Permiso de ubicación denegado. Activa la ubicación del navegador o dispositivo.');
        return false;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude, accuracy, altitude } = current.coords;
      const accuracyText = formatAccuracyLabel(accuracy ?? null);
      const label = formatLocationLabel(latitude, longitude, accuracyText);

      setLocation({
        label,
        accuracy: accuracyText,
        latitude,
        longitude,
        altitude: altitude ?? null,
      });

      return true;
    } catch {
      setError('No se pudo capturar la ubicación. Revisa permisos, GPS o navegador.');
      return false;
    } finally {
      setCapturing(false);
    }
  }, [setLocation]);

  return { captureLocation, capturing, locationError: error };
}
