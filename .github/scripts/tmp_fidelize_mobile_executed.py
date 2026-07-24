from pathlib import Path

path = Path('apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx')
text = path.read_text()


def block(*lines: str) -> str:
    return '\n'.join(lines)


def replace_once(source: str, target: str, label: str) -> None:
    global text
    if text.count(source) != 1:
        raise SystemExit(f'{label}: expected one match, found {text.count(source)}')
    text = text.replace(source, target, 1)


replace_once(
    block(
        'function groupCounterLabel(group: GroupConfig, count: number): string {',
        '  return count === 1 ? group.singular : group.label;',
        '}',
    ),
    block(
        'function groupCounterLabel(group: GroupConfig, count: number): string {',
        '  return count === 1 ? group.singular : group.label;',
        '}',
        '',
        'function findingStatusLabel(group: InspectionDetailFindingGroupKey): string {',
        "  if (group === 'executed') return 'Ejecutado';",
        "  if (group === 'open') return 'Abierto';",
        "  if (group === 'closed') return 'Cerrado';",
        "  return 'Rechazado';",
        '}',
    ),
    'status label helper',
)

replace_once(
    block(
        '  after = false,',
        '  emptyLabel,',
        '}: {',
        '  title: string;',
        '  evidence?: InspectionDetailEvidenceResponse;',
        '  after?: boolean;',
        '  emptyLabel: string;',
        '}) {',
    ),
    block(
        '  after = false,',
        '  completed = false,',
        '  emptyLabel,',
        '}: {',
        '  title: string;',
        '  evidence?: InspectionDetailEvidenceResponse;',
        '  after?: boolean;',
        '  completed?: boolean;',
        '  emptyLabel: string;',
        '}) {',
    ),
    'EvidenceBox signature',
)

replace_once(
    block(
        '        <View style={[styles.evidenceEmpty, after && styles.evidenceAfterEmpty]}>',
        '          {after ? null : <FontAwesome5 name="image" size={16} color={colors.blueLink} />}',
        '          <Text style={styles.evidenceEmptyText}>{emptyLabel}</Text>',
        '        </View>',
    ),
    block(
        '        <View style={[styles.evidenceEmpty, after && styles.evidenceAfterEmpty, completed && styles.evidenceCompletedEmpty]}>',
        '          {after && !completed ? null : (',
        '            <FontAwesome5 name="image" size={completed ? 20 : 16} color={completed ? colors.successTxt : colors.blueLink} />',
        '          )}',
        '          <Text style={[styles.evidenceEmptyText, completed && styles.evidenceCompletedText]}>{emptyLabel}</Text>',
        '        </View>',
    ),
    'EvidenceBox empty state',
)

replace_once(
    block(
        'function CompactInfoRow({ label, value, valueColor = colors.primary }: { label: string; value: string; valueColor?: string }) {',
        '  return (',
        '    <View style={styles.compactInfoRow}>',
        '      <Text style={styles.compactInfoLabel}>{label}</Text>',
        '      <Text style={[styles.compactInfoValue, { color: valueColor }]}>{value}</Text>',
        '    </View>',
        '  );',
        '}',
    ),
    block(
        'function CompactInfoRow({',
        '  label,',
        '  value,',
        '  valueColor = colors.primary,',
        '  alert = false,',
        '}: {',
        '  label: string;',
        '  value: string;',
        '  valueColor?: string;',
        '  alert?: boolean;',
        '}) {',
        '  return (',
        '    <View style={styles.compactInfoRow}>',
        '      <Text style={styles.compactInfoLabel}>{label}</Text>',
        '      <View style={styles.compactInfoValueRow}>',
        '        {alert ? <FontAwesome5 name="exclamation-circle" size={9} color={valueColor} solid /> : null}',
        '        <Text style={[styles.compactInfoValue, { color: valueColor }]}>{value}</Text>',
        '      </View>',
        '    </View>',
        '  );',
        '}',
    ),
    'CompactInfoRow',
)

replace_once(
    '          <Text style={[styles.statusPillText, { color: group.color }]}>{group.singular}</Text>',
    '          <Text style={[styles.statusPillText, { color: group.color }]}>{findingStatusLabel(item.statusGroup)}</Text>',
    'finding status pill',
)

replace_once(
    '          <EvidenceBox title="DESPUÉS" evidence={item.afterEvidence[0]} after emptyLabel="Pendiente EECC" />',
    block(
        '          <EvidenceBox',
        '            title="DESPUÉS"',
        '            evidence={item.afterEvidence[0]}',
        '            after',
        "            completed={item.statusGroup !== 'open'}",
        "            emptyLabel={item.statusGroup === 'open' ? 'Pendiente EECC' : ''}",
        '          />',
    ),
    'after evidence',
)

replace_once(
    '          <CompactInfoRow label="SLA calculado" value={daysLabel(item.dueAt)} valueColor={colors.dangerTxt} />',
    '          <CompactInfoRow label="SLA calculado" value={daysLabel(item.dueAt)} valueColor={colors.dangerTxt} alert />',
    'executed SLA row',
)

replace_once(
    block(
        "        {!readOnly && item.statusGroup === 'executed' && !actions.canReview ? (",
        '          <View style={styles.waitingReview}>',
        '            <Text style={styles.waitingReviewText}>En espera de revisión Gold Fields</Text>',
        '          </View>',
        '        ) : null}',
    ),
    block(
        "        {actions.canExecute && item.statusGroup === 'executed' && !actions.canReview ? (",
        '          <View style={styles.waitingReview}>',
        '            <FontAwesome5 name="clock" size={11} color="#e8a820" solid />',
        '            <Text style={styles.waitingReviewText}>Esperando Aprobación o rechazo de observación</Text>',
        '          </View>',
        '        ) : null}',
    ),
    'assigned company waiting state',
)

replace_once(
    block(
        "  const tabs: Array<{ key: DetailTab; label: string }> = detail?.header.kind === 'checklist'",
        '    ? [',
        "        { key: 'observations', label: 'Ítems NO' },",
        "        { key: 'result', label: 'Resultado completo' },",
        "        { key: 'followups', label: 'Seguimientos' },",
        "        { key: 'general', label: 'Datos generales' },",
        '      ]',
        '    : [',
        "        { key: 'observations', label: 'Observaciones' },",
        "        { key: 'followups', label: 'Seguimientos' },",
        "        { key: 'general', label: 'Datos generales' },",
        '      ];',
    ),
    block(
        '  const assignedCompanyView = actions.canExecute && !actions.canReview;',
        "  const tabs: Array<{ key: DetailTab; label: string }> = detail?.header.kind === 'checklist'",
        '    ? [',
        "        { key: 'observations', label: 'Ítems NO' },",
        "        { key: 'result', label: 'Resultado completo' },",
        "        { key: 'followups', label: 'Seguimientos' },",
        "        { key: 'general', label: 'Datos generales' },",
        '      ]',
        '    : assignedCompanyView',
        '      ? [',
        "          { key: 'observations', label: 'Observaciones' },",
        "          { key: 'general', label: 'Datos generales' },",
        '        ]',
        '      : [',
        "          { key: 'observations', label: 'Observaciones' },",
        "          { key: 'followups', label: 'Seguimientos' },",
        "          { key: 'general', label: 'Datos generales' },",
        '        ];',
    ),
    'capability tabs',
)

replace_once(
    block(
        "  evidenceAfterEmpty: { backgroundColor: '#d8eff9' },",
        '  evidenceEmptyText: { color: colors.placeholder, fontSize: 10, lineHeight: 12 },',
    ),
    block(
        "  evidenceAfterEmpty: { backgroundColor: '#d8eff9' },",
        "  evidenceCompletedEmpty: { backgroundColor: '#dafccb' },",
        '  evidenceEmptyText: { color: colors.placeholder, fontSize: 10, lineHeight: 12 },',
        '  evidenceCompletedText: { color: colors.successTxt },',
    ),
    'evidence styles',
)

replace_once(
    block(
        '  compactInfoLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },',
        '  compactInfoValue: { fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },',
    ),
    block(
        '  compactInfoLabel: { color: colors.muted, fontSize: 12, lineHeight: 15, fontWeight: fontWeight.medium },',
        "  compactInfoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },",
        '  compactInfoValue: { fontSize: 11, lineHeight: 13, fontWeight: fontWeight.bold },',
    ),
    'compact info styles',
)

replace_once(
    block(
        '  waitingReview: { marginTop: 4, borderRadius: 8, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 10 },',
        "  waitingReviewText: { color: colors.muted, fontSize: 11, textAlign: 'center', fontWeight: fontWeight.semibold },",
    ),
    block(
        "  waitingReview: { minHeight: 33, marginTop: 4, borderRadius: 8, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9 },",
        '  waitingReviewText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },',
    ),
    'waiting styles',
)

path.write_text(text)
