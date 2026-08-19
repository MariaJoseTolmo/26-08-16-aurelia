# Pixel review 2026-06-25 - Home mobile inspecciones

## Referencia Figma usada

```txt
https://www.figma.com/design/DymqBWIjfxvuU6UK9wNI3p/Medio-Ambiente-Core?node-id=642-3112&m=dev
```

Nodo:

```txt
642:3112
```

## Correcciones aplicadas

- Se removió la barra mock de hora/señal del header mobile. Esa información pertenece al sistema operativo/dispositivo, no al código de la vista.
- Se reemplazó el logo del header por `apps/mobile-inspecciones/assets/icons/logo_mobile.svg`.
- Se reemplazó el logo del login por `logo_mobile.svg`.
- Se agregaron íconos dentro de chips superiores de las cards.
- Se agregaron íconos dentro de filas de estado de las cards.
- Se ajustó el tab inferior para que use punto visual como Figma, no texto de punto grande.
- Se dejó visible `Formularios inconclusos` aunque no exista draft real, con fallback visual del diseño.
- Se implementó el footer con degradado Figma usando `react-native-svg`, sin agregar dependencias nuevas.
- Se ajustó la alineación óptica de los textos de badges `Alto`, `Crítico`, `Medio` con `lineHeight` e `includeFontPadding`.
- Se mantuvo la conexión real con API y contracts; no se volvió a mocks permanentes.

## Follow-up 2026-06-25

- El padding superior en chips debe quedar en `0`, no compensado con `1px`.
- No se debe commitear la key de FontAwesome ni registrarla en documentación.
- Para iconografía real de Figma, se recomienda exportar los SVG usados por el diseño a `assets/icons` y consumirlos localmente, no consultar una API de iconos en runtime.

## Estilos Figma usados en footer

```txt
border-top: #e3e3e3
from: #002659
to: #004a3a
direction: vertical
```

## Checklist pixel-to-pixel obligatorio por iteración

En cada iteración de diseño a código se debe completar este checklist:

1. Leer el nodo Figma exacto con `get_design_context` o `get_metadata`.
2. Identificar si el frame contiene elementos de dispositivo no productivos: hora, señal, notch, carcasa, sombra externa.
3. No implementar en código elementos que pertenecen al mock de dispositivo.
4. Verificar assets oficiales existentes en repo antes de reconstruir logos o íconos.
5. Usar SVG real si existe en `assets/icons`.
6. Comparar visualmente: header, logo, botones, chips, cards, tabs, spacing, colores y tipografía.
7. Mantener data real con services/hooks aunque el layout venga desde Figma.
8. Documentar diferencias pendientes y comandos de prueba.

## Pendientes visuales

- Validar en navegador si la altura del header sin status mock calza con SafeArea real.
- Revisar si `logo_mobile.svg`, al ser blanco, requiere versión dark para el login o si debe ir sobre fondo navy como quedó ahora.
- Revisar si los íconos internos de filas deben exportarse 1:1 desde Figma para reemplazar FontAwesome en una iteración posterior.
- Consolidar la home antigua cuando esta versión quede validada.

## Archivos modificados en esta iteración

```txt
apps/mobile-inspecciones/src/modules/inspection/InspectionsHomeFigmaScreen.tsx
apps/mobile-inspecciones/src/modules/auth/AureliaAccessScreen.tsx
docs/chat-gpt/mobile-inspecciones/pixel_review_2026_06_25_home.md
```

## Comandos de prueba

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia
git pull origin main
pnpm install
pnpm --filter api start:dev
```

En otro terminal:

```powershell
cd C:\Users\carlo\Desktop\aurelia\Aurelia\apps\mobile-inspecciones
pnpm web -- --clear
```
