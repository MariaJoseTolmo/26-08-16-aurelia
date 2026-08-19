import { useCallback, useState } from 'react';
import { formatAccuracyLabel, formatLocationLabel } from '../services/geo.utils';
import { useNewInspectionDraftStore } from '../state/newInspectionDraft.store';

export function useNewInspectionLocation() {
  const setLocation = useNewInspectionDraftStore((state) => state.setLocation);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalizacion no disponible en este navegador.');
      return false;
    }

    setCapturing(true);
    setError(null);

    const result = await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude } = position.coords;
          const accuracyText = formatAccuracyLabel(accuracy ?? null);
          const label = formatLocationLabel(latitude, longitude, accuracyText);

          setLocation({
            label,
            accuracy: accuracyText,
            latitude,
            longitude,
            altitude: altitude ?? null,
          });

          resolve(true);
        },
        () => {
          setError('No se pudo capturar la ubicacion. Revisa permisos del navegador.');
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        },
      );
    });

    setCapturing(false);
    return result;
  }, [setLocation]);

  return { captureLocation, capturing, locationError: error };
}
