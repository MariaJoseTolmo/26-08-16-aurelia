from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ICON_PATH = ROOT / "apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailIcons.tsx"

source = ICON_PATH.read_text(encoding="utf-8")

old_props = "type IconProps = {\n  width?: number;\n  height?: number;\n};"
new_props = "type IconProps = {\n  width?: number;\n  height?: number;\n  color?: string;\n};"
if source.count(old_props) != 1:
    raise RuntimeError(f"icon props: expected one match, found {source.count(old_props)}")
source = source.replace(old_props, new_props, 1)

old_signature = "export function MobileInspectionSlaAlertIcon({ width = 12, height = 9 }: IconProps) {"
new_signature = "export function MobileInspectionSlaAlertIcon({ width = 12, height = 9, color = '#570B1D' }: IconProps) {"
if source.count(old_signature) != 1:
    raise RuntimeError(f"SLA signature: expected one match, found {source.count(old_signature)}")
source = source.replace(old_signature, new_signature, 1)

old_fill = 'fill="#570B1D" />\n    </Svg>\n  );\n}\n'
position = source.rfind(old_fill)
if position < 0:
    raise RuntimeError("SLA fill was not found")
source = source[:position] + 'fill={color} />\n    </Svg>\n  );\n}\n' + source[position + len(old_fill):]

ICON_PATH.write_text(source, encoding="utf-8")
