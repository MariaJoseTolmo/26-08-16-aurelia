import { useQuery } from '@tanstack/react-query';
import {
  listOriginSectors,
  listWasteCategories,
  listWasteTypes,
  listWasteUnits,
} from '../services/waste-catalogs.service';

/**
 * Lecturas de catálogo del módulo de residuos.
 *
 * Un hook por endpoint, con la query key describiendo recurso + filtros, como
 * el resto de `shared/hooks`.
 *
 * `staleTime` alto en los tres catálogos de residuos: son tablas de
 * configuración que cambian cuando alguien edita el maestro, no durante una
 * sesión de registro. Sin él, volver al formulario refetchea las tres listas y
 * los selectores parpadean a "Cargando…" con el dato ya en cache.
 */

const CATALOG_STALE_TIME_MS = 5 * 60 * 1000;

export function useWasteCategories() {
  return useQuery({
    queryKey: ['waste', 'categories'],
    queryFn: listWasteCategories,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useWasteUnits() {
  return useQuery({
    queryKey: ['waste', 'units'],
    queryFn: listWasteUnits,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

/**
 * Residuos de una categoría.
 *
 * Sin categoría elegida la query queda DESHABILITADA en vez de traer el
 * catálogo completo: el diseño encadena los dos selectores —"La categoría
 * operativa determina automáticamente si el residuo es peligroso"—, así que
 * ofrecer residuos de otras categorías contradice la regla que enuncia la
 * tarjeta.
 */
export function useWasteTypes(categoryId: string | null) {
  return useQuery({
    queryKey: ['waste', 'types', { categoryId }],
    queryFn: () => listWasteTypes(categoryId),
    enabled: categoryId !== null,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

/**
 * Catálogo COMPLETO de residuos, sin acotar por categoría.
 *
 * Lo pide la tarjeta "Lote seleccionado" de la solicitud del retirador (nodo
 * `4223:9920`), donde "Residuo" y "Categoría" son dos selectores independientes:
 * ese nodo no encadena nada y su tarjeta no enuncia ninguna regla que los ate,
 * al revés de `3713:26885` en la recepción a bodega.
 *
 * Va con su propia query key —`'all'` en vez de `{ categoryId: null }`— para no
 * compartir entrada de cache con `useWasteTypes(null)`, que está DESHABILITADA y
 * significa lo contrario: "todavía no hay categoría elegida".
 */
export function useAllWasteTypes() {
  return useQuery({
    queryKey: ['waste', 'types', 'all'],
    queryFn: () => listWasteTypes(),
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useOriginSectors() {
  return useQuery({
    queryKey: ['organization', 'sectors'],
    queryFn: listOriginSectors,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
