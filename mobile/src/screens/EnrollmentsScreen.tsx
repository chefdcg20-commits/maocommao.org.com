import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { api, ApiError, Enrollment, errorText } from "../api";
import { BELT_COLORS } from "../belts";
import { LINKS } from "../info";
import { colors } from "../theme";
import EditStudentModal from "./EditStudentModal";
import { BeltBar, Button, Chips, fmtDate, Header, styles } from "../ui";

const STATUS: Record<string, string> = {
  pending: "Pendente", under_review: "Em análise", changes_requested: "Ajustes solicitados", approved: "Aprovado", rejected: "Recusado",
};
const WAITING = ["pending", "under_review", "changes_requested"];

// Cadastros de alunos (so mestres): ver dados, aprovar, recusar e definir faixa.
export default function EnrollmentsScreen() {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState("waiting");
  const [open, setOpen] = useState<string | null>(null);
  const [beltFor, setBeltFor] = useState<Enrollment | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api<{ enrollments: Enrollment[] }>({ action: "list" }, "admin")).enrollments);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => rows.filter((r) => (filter === "all" ? true : filter === "waiting" ? WAITING.includes(r.status) : r.status === filter)),
    [rows, filter],
  );

  async function run(id: string, body: Record<string, unknown>, success?: string) {
    setBusy(id);
    try {
      await api(body, "admin");
      if (success) Alert.alert(success);
      await load();
    } catch (e) {
      Alert.alert("Não foi possível concluir", errorText(e));
    } finally {
      setBusy("");
    }
  }

  function approve(row: Enrollment) {
    Alert.alert("Aprovar cadastro?", `${row.student_full_name}\nGera a matrícula e a carteirinha válida por 2 anos.`, [
      { text: "Não", style: "cancel" },
      { text: "Aprovar", onPress: () => run(row.id, { action: "approve", id: row.id }, "Aprovado! Carteirinha pronta para imprimir no site.") },
    ]);
  }

  function reject(row: Enrollment) {
    Alert.alert("Qual ação?", row.student_full_name, [
      { text: "Pedir ajustes", onPress: () => run(row.id, { action: "set_status", id: row.id, status: "changes_requested" }) },
      { text: "Recusar", style: "destructive", onPress: () => run(row.id, { action: "set_status", id: row.id, status: "rejected" }) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  const counts = {
    waiting: rows.filter((r) => WAITING.includes(r.status)).length,
    approved: rows.filter((r) => r.status === "approved").length,
  };

  return (
    <View style={styles.screen}>
      <Header title="Cadastros" sub={`${counts.waiting} aguardando · ${counts.approved} aprovados`} />
      <Chips value={filter} onChange={setFilter} items={[{ key: "waiting", label: "Aguardando" }, { key: "approved", label: "Aprovados" }, { key: "rejected", label: "Recusados" }, { key: "all", label: "Todos" }]} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && !rows.length ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum cadastro nesta lista.</Text>}
          contentContainerStyle={{ paddingBottom: 90 }}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <Pressable onPress={() => setOpen(open === r.id ? null : r.id)} onLongPress={() => setEditing(r.id)} delayLongPress={450} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                {r.photo_url ? <Image source={{ uri: r.photo_url }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.border }]} />}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.strong} numberOfLines={1}>{r.student_full_name}</Text>
                  <Text style={styles.muted}>{STATUS[r.status] || r.status} · {fmtDate(r.created_at)}{r.training_time ? ` · ${r.training_time.slice(0, 2)}h` : ""}</Text>
                  <BeltBar belt={r.belt} stripes={r.belt_stripes} width={30} />
                </View>
                <Text style={{ color: colors.muted, fontSize: 20 }}>{open === r.id ? "⌃" : "⌄"}</Text>
              </Pressable>

              {open === r.id && (
                <View style={{ marginTop: 10, gap: 4 }}>
                  <Text style={styles.muted}>Nascimento: <Text style={styles.text}>{fmtDate(r.birth_date)}</Text></Text>
                  <Text style={styles.muted}>Responsável: <Text style={styles.text}>{r.guardian_full_name || "—"}{r.guardian_relationship ? ` (${r.guardian_relationship})` : ""}</Text></Text>
                  <Text style={styles.muted}>Telefone: <Text style={styles.text}>{r.guardian_phone || "—"}</Text></Text>
                  <Text style={styles.muted}>E-mail: <Text style={styles.text}>{r.guardian_email || "—"}</Text></Text>
                  <Text style={styles.muted}>Emergência: <Text style={styles.text}>{r.emergency_contact_name || "—"} {r.emergency_contact_phone || ""}</Text></Text>
                  <Text style={styles.muted}>Saúde: <Text style={styles.text}>{r.health_notes || "nada informado"}</Text></Text>
                  <Text style={styles.muted}>Uso de imagem: <Text style={styles.text}>{r.image_consent ? "autorizado" : "não autorizado"}</Text></Text>
                  {!!r.membership_number && <Text style={styles.muted}>Matrícula: <Text style={styles.text}>{r.membership_number} · válida até {fmtDate(r.card_valid_until)}</Text></Text>}
                  <View style={{ height: 8 }} />
                  {r.status !== "approved" && <Button label="Aprovar e gerar carteirinha" onPress={() => approve(r)} busy={busy === r.id} />}
                  {r.status !== "approved" && <Button label="Pedir ajustes ou recusar" kind="secondary" onPress={() => reject(r)} disabled={busy === r.id} />}
                  <Button label="Editar cadastro (nome, foto, nascimento)" kind="secondary" onPress={() => setEditing(r.id)} />
                  <Button label={r.belt ? "Alterar faixa" : "Definir faixa"} kind="secondary" onPress={() => setBeltFor(r)} />
                  {r.status === "approved" && <Button label="Imprimir carteirinha (abre o site)" kind="secondary" onPress={() => Linking.openURL(`${LINKS.adminPanel}`).catch(() => undefined)} />}
                </View>
              )}
            </View>
          )}
        />
      )}

      {editing && <EditStudentModal id={editing} onClose={(changed) => { setEditing(null); if (changed) load(); }} />}
      {beltFor && <BeltPicker row={beltFor} onClose={() => setBeltFor(null)} onPick={(belt, stripes) => { const id = beltFor.id; setBeltFor(null); run(id, { action: "set_belt", id, belt, stripes }); }} />}
    </View>
  );
}

function BeltPicker({ row, onClose, onPick }: { row: Enrollment; onClose: () => void; onPick: (belt: string | null, stripes: number) => void }) {
  const [stripes, setStripes] = useState(row.belt_stripes || 0);
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 48, paddingHorizontal: 16 }}>
        <Header title="Faixa" sub={row.student_full_name} />
        <Text style={[styles.muted, { marginBottom: 6 }]}>Graus</Text>
        <Chips value={String(stripes)} onChange={(v) => setStripes(Number(v))} items={[0, 1, 2, 3, 4].map((n) => ({ key: String(n), label: String(n) }))} />
        <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
          {Object.entries(BELT_COLORS).map(([key, info]) => (
            <Pressable key={key} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }, row.belt === key && { borderColor: colors.amber }]} onPress={() => onPick(key, stripes)}>
              <View style={{ width: 60, height: 12, borderRadius: 3, borderWidth: 1, backgroundColor: info.main, borderColor: info.stripe || colors.border }} />
              <Text style={styles.text}>{info.label}</Text>
            </Pressable>
          ))}
          <Button label="Sem faixa definida" kind="secondary" onPress={() => onPick(null, 0)} />
          <Button label="Fechar" kind="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export { ApiError };
