from pathlib import Path

path = Path('apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx')
text = path.read_text()


def replace_once(source: str, target: str, label: str) -> None:
    global text
    count = text.count(source)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text = text.replace(source, target, 1)


replace_once(
    "import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';\n",
    "import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';\nimport { MobileFindingExecutionModal } from './MobileFindingExecutionModal';\n",
    'execution modal import',
)

old_render = """      <ActionDialog
        mode={actionMode}
        item={actionTarget}
        pending={actions.isPending}
        onClose={() => { setActionMode(null); setActionTarget(null); }}
        onSubmit={(description, evidence) => { void submitAction(description, evidence); }}
      />"""

new_render = """      {detail && actionTarget ? (
        <MobileFindingExecutionModal
          visible={actionMode === 'execute'}
          detail={detail}
          item={actionTarget}
          index={Math.max(0, allFindings(detail).findIndex((item) => item.findingId === actionTarget.findingId))}
          itemLabel={detail.header.kind === 'checklist' ? 'Ítem' : 'Obs.'}
          pending={actions.isPending}
          canReview={actions.canReview}
          onClose={() => { setActionMode(null); setActionTarget(null); }}
          onSubmit={(description, evidence) => { void submitAction(description, evidence); }}
        />
      ) : null}
      <ActionDialog
        mode={actionMode === 'reject' ? actionMode : null}
        item={actionTarget}
        pending={actions.isPending}
        onClose={() => { setActionMode(null); setActionTarget(null); }}
        onSubmit={(description, evidence) => { void submitAction(description, evidence); }}
      />"""

replace_once(old_render, new_render, 'action modal render')
path.write_text(text)
