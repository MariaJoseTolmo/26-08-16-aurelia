from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ICON_PATH = ROOT / "apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailIcons.tsx"
MODAL_PATH = ROOT / "apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx"


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return source.replace(old, new, 1)


def patch_icons() -> None:
    source = ICON_PATH.read_text(encoding="utf-8")
    source = replace_once(
        source,
        "type IconProps = {\n  width?: number;\n  height?: number;\n};",
        "type IconProps = {\n  width?: number;\n  height?: number;\n  color?: string;\n};",
        "icon props",
    )
    source = replace_once(
        source,
        "export function MobileInspectionSlaAlertIcon({ width = 12, height = 9 }: IconProps) {",
        "export function MobileInspectionSlaAlertIcon({ width = 12, height = 9, color = '#570B1D' }: IconProps) {",
        "SLA icon signature",
    )
    source = replace_once(
        source,
        'fill="#570B1D" />\n    </Svg>\n  );\n}\n',
        'fill={color} />\n    </Svg>\n  );\n}\n',
        "SLA icon fill",
    )
    ICON_PATH.write_text(source, encoding="utf-8")


def patch_modal() -> None:
    source = MODAL_PATH.read_text(encoding="utf-8")

    source = replace_once(
        source,
        "import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';\n",
        "import { MobileInspectionChecklistResultPanel } from './MobileInspectionChecklistResultPanel';\nimport {\n  MobileInspectionApproveIcon,\n  MobileInspectionFollowupIcon,\n  MobileInspectionPdfIcon,\n  MobileInspectionRejectIcon,\n  MobileInspectionSlaAlertIcon,\n  MobileInspectionTimelineCompletedIcon,\n  MobileInspectionTimelinePendingIcon,\n} from './MobileInspectionDetailIcons';\n",
        "detail icon import",
    )

    source = replace_once(
        source,
        "type FollowupStep = {\n  id: string;\n  title: string;\n  date: string;\n  summary?: string;\n  completed: boolean;\n  occurredAt?: string | null;\n};",
        "type FollowupStep = {\n  id: string;\n  sequenceNumber?: number;\n  title: string;\n  date: string;\n  summary?: string;\n  bullets?: string[];\n  completed: boolean;\n  occurredAt?: string | null;\n};",
        "followup type",
    )

    source = replace_once(
        source,
        "{alert ? <FontAwesome5 name=\"exclamation-circle\" size={9} color={valueColor} solid /> : null}",
        "{alert ? <MobileInspectionSlaAlertIcon color={valueColor} /> : null}",
        "SLA alert icon",
    )

    source = replace_once(
        source,
        '<CompactInfoRow label="SLA cerrado" value={daysLabel(item.dueAt)} valueColor={colors.ocreTxt} />',
        '<CompactInfoRow label="SLA cerrado" value={daysLabel(item.dueAt)} valueColor={colors.ocreTxt} alert />',
        "closed SLA alert",
    )

    source = replace_once(
        source,
        '<Feather name="x-circle" size={14} color={colors.dangerTxt} />',
        '<MobileInspectionRejectIcon />',
        "reject icon",
    )
    source = replace_once(
        source,
        '<Feather name="check-circle" size={14} color={colors.white} />',
        '<MobileInspectionApproveIcon />',
        "approve icon",
    )
    source = replace_once(
        source,
        '<FontAwesome5 name="file-pdf" size={13} color={colors.body} />',
        '<MobileInspectionPdfIcon />',
        "PDF icon",
    )

    old_followups = '''function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const observedCount = allFindings(detail).length;
  const events: FollowupStep[] = [];
  detail.followups.forEach((step) => {
    events.push({
      id: `followup-${step.followupId}`,
      title: step.title || `Seguimiento ${step.sequenceNumber}`,
      date: formatDate(step.performedAt),
      summary: step.description,
      completed: step.completed,
      occurredAt: step.performedAt,
    });
  });
  allFindings(detail).forEach((item, index) => {
    const observationLabel = `Obs. ${index + 1}`;
    if (item.executedAt) events.push({ id: `executed-${item.findingId}`, title: `${observationLabel} ejecutada`, date: formatDate(item.executedAt), summary: item.executedActionDescription ?? 'Observación marcada como ejecutada', completed: true, occurredAt: item.executedAt });
    if (item.rejectedAt) events.push({ id: `rejected-${item.findingId}`, title: `${observationLabel} rechazada`, date: formatDate(item.rejectedAt), summary: item.rejectionReason ?? 'Observación rechazada y devuelta a corrección', completed: true, occurredAt: item.rejectedAt });
    if (item.closedAt) events.push({ id: `closed-${item.findingId}`, title: `${observationLabel} cerrada`, date: formatDate(item.closedAt), summary: 'Cierre aprobado por Gold Fields', completed: true, occurredAt: item.closedAt });
  });
  const sorted = events.sort((left, right) => toTimestamp(left.occurredAt) - toTimestamp(right.occurredAt));
  return [{ id: 'initial', title: 'Inspección inicial', date: formatDate(detail.general.scheduledAt), summary: `${observedCount} observaciones detectadas`, completed: true, occurredAt: detail.general.scheduledAt }, ...sorted];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = useMemo(() => buildFollowupSteps(detail), [detail]);
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeading}>
        <FontAwesome5 name="users" size={11} color={colors.blueLink} />
        <Text style={styles.sectionHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={[styles.timelineRow, !isLast && styles.timelineRowSpacing]}>
              <View style={styles.timelineAxis}>
                <View style={[styles.timelineMarker, !step.completed && styles.timelineMarkerPending]}>
                  <Text style={[styles.timelineMarkerText, !step.completed && styles.timelineMarkerTextPending]}>{step.completed ? '✓' : '○'}</Text>
                </View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.summary ? <Text style={styles.timelineDescription}>{step.summary}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
'''

    new_followups = '''function buildFollowupSteps(detail: InspectionDetailResponse): FollowupStep[] {
  const findings = allFindings(detail);
  const total = findings.length;
  const percentage = (value: number) => total === 0 ? 0 : Math.round((value / total) * 100);
  const bulletsAt = (occurredAt: string | null) => {
    const closed = occurredAt
      ? findings.filter((item) => item.closedAt && toTimestamp(item.closedAt) <= toTimestamp(occurredAt)).length
      : detail.header.counts.closed;
    const normalizedClosed = Math.max(0, Math.min(total, closed));
    const pending = Math.max(0, total - normalizedClosed);
    return [
      `Observaciones cerradas: ${normalizedClosed} obs / ${percentage(normalizedClosed)}%`,
      `Observaciones pendientes: ${pending} obs / ${percentage(pending)}%`,
    ];
  };

  const followupsBySequence = new Map<number, typeof detail.followups>();
  detail.followups.forEach((followup) => {
    const current = followupsBySequence.get(followup.sequenceNumber) ?? [];
    current.push(followup);
    followupsBySequence.set(followup.sequenceNumber, current);
  });

  let recordedSteps: FollowupStep[] = Array.from(followupsBySequence.entries())
    .sort(([left], [right]) => left - right)
    .map(([sequenceNumber, records]) => {
      const dates = records
        .map((record) => record.performedAt)
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => toTimestamp(left) - toTimestamp(right));
      const occurredAt = dates.length > 0 ? dates[dates.length - 1] : null;
      const completed = records.some((record) => record.completed);
      return {
        id: `followup-${sequenceNumber}`,
        sequenceNumber,
        title: `Seguimiento ${sequenceNumber}`,
        date: completed ? formatDate(occurredAt) : '—',
        bullets: completed ? bulletsAt(occurredAt) : undefined,
        completed,
        occurredAt,
      };
    });

  if (recordedSteps.length === 0) {
    const latestActivityByDate = new Map<string, string>();
    findings.forEach((item) => {
      [item.executedAt, item.rejectedAt, item.closedAt].forEach((value) => {
        if (!value) return;
        const timestamp = toTimestamp(value);
        if (timestamp === Number.MAX_SAFE_INTEGER) return;
        const dateKey = new Date(timestamp).toISOString().slice(0, 10);
        const current = latestActivityByDate.get(dateKey);
        if (!current || toTimestamp(value) > toTimestamp(current)) latestActivityByDate.set(dateKey, value);
      });
    });
    recordedSteps = Array.from(latestActivityByDate.values())
      .sort((left, right) => toTimestamp(left) - toTimestamp(right))
      .slice(0, 3)
      .map((occurredAt, index) => ({
        id: `derived-followup-${index + 1}`,
        sequenceNumber: index + 1,
        title: `Seguimiento ${index + 1}`,
        date: formatDate(occurredAt),
        bullets: bulletsAt(occurredAt),
        completed: true,
        occurredAt,
      }));
  }

  const stepBySequence = new Map(recordedSteps.map((step, index) => [step.sequenceNumber ?? index + 1, step]));
  const highestSequence = Math.max(3, ...Array.from(stepBySequence.keys()));
  const followupSteps = Array.from({ length: highestSequence }, (_, index) => {
    const sequenceNumber = index + 1;
    return stepBySequence.get(sequenceNumber) ?? {
      id: `pending-followup-${sequenceNumber}`,
      sequenceNumber,
      title: `Seguimiento ${sequenceNumber}`,
      date: '—',
      completed: false,
      occurredAt: null,
    };
  });

  return [{
    id: 'initial',
    title: 'Inspección inicial',
    date: formatDate(detail.general.scheduledAt),
    summary: total === 1 ? '1 observación detectada' : `${total} observaciones detectadas`,
    completed: true,
    occurredAt: detail.general.scheduledAt,
  }, ...followupSteps];
}

function FollowupsPanel({ detail }: { detail: InspectionDetailResponse }) {
  const steps = useMemo(() => buildFollowupSteps(detail), [detail]);
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeading}>
        <MobileInspectionFollowupIcon />
        <Text style={styles.sectionHeadingText}>HISTORIAL DE SEGUIMIENTOS</Text>
      </View>
      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <View key={step.id} style={styles.timelineRow}>
              <View style={styles.timelineAxis}>
                {step.completed ? <MobileInspectionTimelineCompletedIcon /> : <MobileInspectionTimelinePendingIcon />}
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={[styles.timelineCopy, !isLast && styles.timelineCopySpacing]}>
                <Text style={styles.timelineTitle}>{step.title}</Text>
                <Text style={styles.timelineDate}>{step.date}</Text>
                {step.summary ? <Text style={styles.timelineDescription}>{step.summary}</Text> : null}
                {step.bullets ? (
                  <View style={styles.timelineBulletList}>
                    {step.bullets.map((bullet) => (
                      <View key={bullet} style={styles.timelineBulletRow}>
                        <Text style={styles.timelineBullet}>•</Text>
                        <Text style={styles.timelineBulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
'''
    source = replace_once(source, old_followups, new_followups, "followup panel")

    source = replace_once(
        source,
        "  timeline: { marginTop: 10 },\n  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },\n  timelineRowSpacing: { minHeight: 64 },\n  timelineAxis: { width: 24, alignItems: 'center' },\n  timelineMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },\n  timelineMarkerPending: { backgroundColor: colors.border },\n  timelineMarkerText: { color: colors.white, fontSize: 10, lineHeight: 12 },\n  timelineMarkerTextPending: { color: colors.placeholder },\n  timelineLine: { width: 2, flex: 1, minHeight: 38, backgroundColor: colors.border },\n  timelineCopy: { flex: 1, paddingTop: 2, paddingLeft: 12, paddingBottom: 16 },\n  timelineTitle: { color: colors.primary, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },\n  timelineDate: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 13 },\n  timelineDescription: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 15 },",
        "  timeline: { marginTop: 10 },\n  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },\n  timelineAxis: { width: 24, alignItems: 'center', alignSelf: 'stretch' },\n  timelineLine: { width: 2, flex: 1, minHeight: 16, backgroundColor: colors.border },\n  timelineCopy: { flex: 1, paddingTop: 2, paddingLeft: 12 },\n  timelineCopySpacing: { paddingBottom: 16 },\n  timelineTitle: { color: colors.primary, fontSize: 12, lineHeight: 14, fontWeight: fontWeight.bold },\n  timelineDate: { marginTop: 4, color: colors.muted, fontSize: 11, lineHeight: 13 },\n  timelineDescription: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 15 },\n  timelineBulletList: { marginTop: 4 },\n  timelineBulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 8 },\n  timelineBullet: { width: 12, color: colors.muted, fontSize: 11, lineHeight: 14 },\n  timelineBulletText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 14 },",
        "timeline styles",
    )

    MODAL_PATH.write_text(source, encoding="utf-8")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"icons", "modal"}:
        raise SystemExit("usage: apply_mobile_followup_parity.py [icons|modal]")
    if sys.argv[1] == "icons":
        patch_icons()
    else:
        patch_modal()


if __name__ == "__main__":
    main()
