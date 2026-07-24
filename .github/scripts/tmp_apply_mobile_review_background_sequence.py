from pathlib import Path

path = Path('apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx')
text = path.read_text(encoding='utf-8')


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one match, found {count}: {old[:140]!r}')
    text = text.replace(old, new, 1)


replace_once(
    "  const assignedCompanyView = actions.canExecute && !actions.canReview;\n",
    "  const assignedCompanyView = actions.canExecute && !actions.canReview;\n"
    "  const reviewDialogOpen = actionMode === 'approve' || actionMode === 'reject';\n",
)
replace_once(
    "    <Modal visible={visible} transparent statusBarTranslucent animationType=\"slide\" onRequestClose={onClose}>\n"
    "      <View style={styles.modalRoot}>",
    "    <Modal visible={visible} transparent statusBarTranslucent animationType=\"slide\" onRequestClose={onClose}>\n"
    "      {!reviewDialogOpen ? (\n"
    "      <View style={styles.modalRoot}>",
)
replace_once(
    "        </View>\n      </View>\n\n      {detail && actionTarget ? (",
    "        </View>\n      </View>\n      ) : null}\n\n      {detail && actionTarget ? (",
)

path.write_text(text, encoding='utf-8')
