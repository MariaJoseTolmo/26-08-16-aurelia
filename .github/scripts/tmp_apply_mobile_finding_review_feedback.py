from pathlib import Path

path = Path('apps/mobile-inspecciones/src/modules/inspection/MobileInspectionDetailModal.tsx')
text = path.read_text(encoding='utf-8')


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one match, found {count}: {old[:120]!r}')
    text = text.replace(old, new, 1)


replace_once("  TextInput,\n", "")
replace_once("import * as ImagePicker from 'expo-image-picker';\n", "")
replace_once("import { PhotoSourceSheet } from '../../shared/components/form/PhotoSourceSheet';\n", "")
replace_once(
    "import { MobileFindingExecutionModal } from './MobileFindingExecutionModal';\n",
    "import { MobileFindingExecutionModal } from './MobileFindingExecutionModal';\n"
    "import {\n"
    "  MobileFindingReviewDialog,\n"
    "  MobileFindingReviewSnackbar,\n"
    "} from './MobileFindingReviewFeedback';\n",
)
replace_once(
    "type ActionMode = 'execute' | 'reject' | null;",
    "type ActionMode = 'execute' | 'approve' | 'reject' | null;",
)

replace_once(
    "  onExecute,\n  onReject,\n}: {",
    "  onExecute,\n  onApprove,\n  onReject,\n}: {",
)
replace_once(
    "  onExecute: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onReject: (item: InspectionDetailFindingItemResponse) => void;\n",
    "  onExecute: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onApprove: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onReject: (item: InspectionDetailFindingItemResponse) => void;\n",
)
replace_once(
    "\n  function approve() {\n"
    "    Alert.alert('Aprobar cierre', '¿Confirmas el cierre de esta observación?', [\n"
    "      { text: 'Cancelar', style: 'cancel' },\n"
    "      {\n"
    "        text: 'Aprobar',\n"
    "        onPress: () => {\n"
    "          void actions.approve(inspectionId, item.findingId).catch((error: Error) => {\n"
    "            Alert.alert('No se pudo aprobar', error.message);\n"
    "          });\n"
    "        },\n"
    "      },\n"
    "    ]);\n"
    "  }\n",
    "",
)
replace_once(
    "<TouchableOpacity style={styles.approveAction} disabled={actions.isPending} onPress={approve}>",
    "<TouchableOpacity style={styles.approveAction} disabled={actions.isPending} onPress={() => onApprove(item)}>",
)

start = text.index('function ActionDialog({')
end = text.index('function ResponsibleSelector({', start)
text = text[:start] + text[end:]

replace_once(
    "  onExecute,\n  onReject,\n}: {\n"
    "  detail: InspectionDetailResponse;",
    "  onExecute,\n  onApprove,\n  onReject,\n}: {\n"
    "  detail: InspectionDetailResponse;",
)
replace_once(
    "  onExecute: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onReject: (item: InspectionDetailFindingItemResponse) => void;\n"
    "}) {\n  const itemLabel:",
    "  onExecute: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onApprove: (item: InspectionDetailFindingItemResponse) => void;\n"
    "  onReject: (item: InspectionDetailFindingItemResponse) => void;\n"
    "}) {\n  const itemLabel:",
)
replace_once(
    "                    onExecute={onExecute}\n"
    "                    onReject={onReject}\n",
    "                    onExecute={onExecute}\n"
    "                    onApprove={onApprove}\n"
    "                    onReject={onReject}\n",
)

replace_once(
    "  const [actionTarget, setActionTarget] = useState<InspectionDetailFindingItemResponse | null>(null);\n"
    "  const [reassignVisible, setReassignVisible] = useState(false);\n",
    "  const [actionTarget, setActionTarget] = useState<InspectionDetailFindingItemResponse | null>(null);\n"
    "  const [reviewNotice, setReviewNotice] = useState<string | null>(null);\n"
    "  const [reassignVisible, setReassignVisible] = useState(false);\n",
)

marker = "  }, [detail, requestedFindingId, requestedGroup, visible]);\n\n"
replace_once(
    marker,
    marker
    + "  useEffect(() => {\n"
      "    if (!reviewNotice) return undefined;\n"
      "    const timeoutId = setTimeout(() => setReviewNotice(null), 4000);\n"
      "    return () => clearTimeout(timeoutId);\n"
      "  }, [reviewNotice]);\n\n",
)

replace_once(
    "      if (actionMode === 'reject') {\n"
    "        await actions.reject(detail.header.inspectionId, actionTarget.findingId, description);\n"
    "      } else if (actionMode === 'execute' && evidence) {",
    "      if (actionMode === 'reject') {\n"
    "        await actions.reject(detail.header.inspectionId, actionTarget.findingId, description);\n"
    "        setExpandedGroup(null);\n"
    "        setReviewNotice('Observación rechazada');\n"
    "      } else if (actionMode === 'execute' && evidence) {",
)

approval_anchor = "  async function confirmReassign(ids: string[]) {\n"
approval_function = (
    "  async function submitApproval() {\n"
    "    if (!detail || !actionTarget) return;\n"
    "    try {\n"
    "      await actions.approve(detail.header.inspectionId, actionTarget.findingId);\n"
    "      setExpandedGroup(null);\n"
    "      setActionMode(null);\n"
    "      setActionTarget(null);\n"
    "      setReviewNotice('Observación aprobada');\n"
    "    } catch (error) {\n"
    "      Alert.alert('No se pudo aprobar', error instanceof Error ? error.message : 'Intenta nuevamente.');\n"
    "    }\n"
    "  }\n\n"
)
replace_once(approval_anchor, approval_function + approval_anchor)

replace_once(
    "                onExecute={(item) => openAction('execute', item)}\n"
    "                onReject={(item) => openAction('reject', item)}\n",
    "                onExecute={(item) => openAction('execute', item)}\n"
    "                onApprove={(item) => openAction('approve', item)}\n"
    "                onReject={(item) => openAction('reject', item)}\n",
)

replace_once(
    "        {detail ? (\n"
    "          <View style={styles.footer}>\n"
    "            <TouchableOpacity\n"
    "              style={styles.pdfButton}\n"
    "              onPress={() => Alert.alert('Descargar PDF', 'La exportación PDF autenticada está disponible actualmente desde la versión web.')}\n"
    "            >\n"
    "              <FontAwesome5 name=\"file-pdf\" size={13} color={colors.body} />\n"
    "              <Text style={styles.pdfButtonText}>Descargar PDF</Text>\n"
    "            </TouchableOpacity>\n"
    "          </View>\n"
    "        ) : null}\n"
    "        </View>",
    "        {detail ? (\n"
    "          <View style={styles.footer}>\n"
    "            <TouchableOpacity\n"
    "              style={styles.pdfButton}\n"
    "              onPress={() => Alert.alert('Descargar PDF', 'La exportación PDF autenticada está disponible actualmente desde la versión web.')}\n"
    "            >\n"
    "              <FontAwesome5 name=\"file-pdf\" size={13} color={colors.body} />\n"
    "              <Text style={styles.pdfButtonText}>Descargar PDF</Text>\n"
    "            </TouchableOpacity>\n"
    "          </View>\n"
    "        ) : null}\n"
    "        <MobileFindingReviewSnackbar\n"
    "          message={reviewNotice}\n"
    "          onClose={() => setReviewNotice(null)}\n"
    "        />\n"
    "        </View>",
)

old_dialog = (
    "      <ActionDialog\n"
    "        mode={actionMode === 'reject' ? actionMode : null}\n"
    "        item={actionTarget}\n"
    "        pending={actions.isPending}\n"
    "        onClose={() => { setActionMode(null); setActionTarget(null); }}\n"
    "        onSubmit={(description, evidence) => { void submitAction(description, evidence); }}\n"
    "      />"
)
new_dialog = (
    "      <MobileFindingReviewDialog\n"
    "        mode={actionMode === 'approve' || actionMode === 'reject' ? actionMode : null}\n"
    "        pending={actions.isPending}\n"
    "        onClose={() => { setActionMode(null); setActionTarget(null); }}\n"
    "        onApprove={() => { void submitApproval(); }}\n"
    "        onReject={(reason) => { void submitAction(reason, null); }}\n"
    "      />"
)
replace_once(old_dialog, new_dialog)

path.write_text(text, encoding='utf-8')
