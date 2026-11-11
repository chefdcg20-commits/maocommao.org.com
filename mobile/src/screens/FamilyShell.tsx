import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { api, errorText, FamilyDetail, FamilyStudent } from "../api";
import { BELT_COLORS } from "../belts";
import { colors } from "../theme";
import { BeltBar, Button, fmtDate, Header, styles } from "../ui";

type View_ = { name: "home" } | { name: "link" } | { name: "student"; student: FamilyStudent };

// Area da familia: pais/responsaveis e alunos adultos veem so os alunos que vincularam.
export default function FamilyShell({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View_>({ name: "home" });
  const [students, setStudents] = useState<FamilyStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStudents((await api<{ students: FamilyStudent[] }>({ action: "students" }, "family")).students);
      setError("");
    } catch (e) {
      const text = errorText(e);
      setError(text);
      if (text.startsWith("Sessão expirada")) onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => { load(); }, [load]);

  if (view.name === "link") return <LinkScreen onBack={(done) => { setView({ name: "home" }); if (done) load(); }} />;
  if (view.name === "student") return <StudentScreen student={view.student} onBack={(removed) => { setView({ name: "home" }); if (removed) load(); }} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}>
      <Header title="Meus alunos" sub="Pais, responsáveis e alunos" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label="Vincular aluno" onPress={() => setView({ name: "link" })} />
      {loading && !students.length ? <ActivityIndicator color={colors.amber} style={{ marginTop: 30 }} /> : null}
      {!loading && !students.length && !error && (
        <Text style={styles.empty}>Nenhum aluno vinculado ainda.{"\n"}Toque em "Vincular aluno" e informe a matrícula da carteirinha e a data de nascimento.</Text>
      )}
      {students.map((s) => (
        <Pressable key={s.id} style={[styles.card, { flexDirection: "row", gap: 12, alignItems: "center" }]} onPress={() => setView({ name: "student", student: s })}>
          {s.photo_url ? <Image source={{ uri: s.photo_url }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.border }]} />}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.strong} numberOfLines={1}>{s.name}</Text>
            <BeltBar belt={s.belt} stripes={s.belt_stripes} />
            <Text style={styles.muted}>{s.training_time ? `Treino ${s.training_time.slice(0, 2)}h · ` : ""}{s.attendance_month} presença(s) no mês</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function LinkScreen({ onBack }: { onBack: (done: boolean) => void }) {
  const [membership, setMembership] = useState("");
  const [birth, setBirth] = useState("");
  const [self, setSelf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Aceita DD/MM/AAAA digitado pela pessoa e converte para AAAA-MM-DD.
  const parsed = (() => {
    const m = birth.trim().match(/^(\d{2})\/?(\d{2})\/?(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
  })();

  async function submit() {
    if (!membership.trim() || !parsed) return setError("Informe a matrícula e a data de nascimento (DD/MM/AAAA).");
    setBusy(true);
    setError("");
    try {
      await api({ action: "link_student", membership_number: membership, birth_date: parsed, relationship: self ? "proprio" : "responsavel" }, "family");
      Alert.alert("Aluno vinculado!", "Agora você acompanha as presenças e a faixa.");
      onBack(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
      <Header title="Vincular aluno" sub="Use os dados da carteirinha" right={<Pressable onPress={() => onBack(false)}><Text style={styles.link}>Voltar</Text></Pressable>} />
      <Text style={[styles.muted, { marginBottom: 10 }]}>A matrícula está na carteirinha (exemplo: MCM-2026-0001). A data de nascimento é a do aluno. Os dois precisam bater com o cadastro.</Text>
      <TextInput style={styles.input} placeholder="Matrícula (MCM-2026-0001)" placeholderTextColor={colors.muted} autoCapitalize="characters" value={membership} onChangeText={setMembership} />
      <TextInput style={styles.input} placeholder="Data de nascimento do aluno (DD/MM/AAAA)" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" value={birth} onChangeText={setBirth} maxLength={10} />
      <Pressable onPress={() => setSelf(!self)} style={{ flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: self ? colors.amber : colors.muted, fontSize: 22 }}>{self ? "☑" : "☐"}</Text>
        <Text style={styles.text}>Eu mesmo(a) sou o aluno(a)</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button label="Vincular" onPress={submit} busy={busy} />
    </ScrollView>
  );
}

function StudentScreen({ student, onBack }: { student: FamilyStudent; onBack: (removed: boolean) => void }) {
  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<FamilyDetail>({ action: "student_detail", enrollment_id: student.id }, "family").then(setDetail).catch((e) => setError(errorText(e)));
  }, [student.id]);

  async function send() {
    if (!message.trim()) return;
    setBusy(true);
    try {
      await api({ action: "send_message", enrollment_id: student.id, body: message }, "family");
      setMessage("");
      Alert.alert("Enviado", "Sua mensagem chegou aos mestres.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function unlink() {
    Alert.alert("Desvincular aluno?", `${student.name} deixa de aparecer na sua conta. Você pode vincular de novo depois.`, [
      { text: "Não", style: "cancel" },
      { text: "Desvincular", style: "destructive", onPress: async () => { try { await api({ action: "unlink_student", enrollment_id: student.id }, "family"); onBack(true); } catch (e) { setError(errorText(e)); } } },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Header title={student.name.split(" ")[0]} sub={student.name} right={<Pressable onPress={() => onBack(false)}><Text style={styles.link}>Voltar</Text></Pressable>} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.card, { flexDirection: "row", gap: 12 }]}>
        {student.photo_url ? <Image source={{ uri: student.photo_url }} style={{ width: 96, height: 120, borderRadius: 12 }} /> : null}
        <View style={{ flex: 1, gap: 6 }}>
          <BeltBar belt={student.belt} stripes={student.belt_stripes} width={90} />
          <Text style={styles.text}>{student.belt ? BELT_COLORS[student.belt]?.label : "Faixa não definida"}</Text>
          <Text style={styles.muted}>Matrícula: {student.membership_number || "—"}</Text>
          <Text style={styles.muted}>Carteirinha válida até {fmtDate(student.card_valid_until)}</Text>
          <Text style={styles.muted}>Treino: {student.training_time ? `${student.training_time.slice(0, 2)}h` : "—"}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        <View style={[styles.card, { flex: 1, alignItems: "center" }]}><Text style={{ color: colors.green, fontSize: 28, fontWeight: "900" }}>{student.attendance_month}</Text><Text style={styles.muted}>no mês</Text></View>
        <View style={[styles.card, { flex: 1, alignItems: "center" }]}><Text style={{ color: colors.amber, fontSize: 28, fontWeight: "900" }}>{student.attendance_total}</Text><Text style={styles.muted}>no total</Text></View>
        <View style={[styles.card, { flex: 1, alignItems: "center" }]}><Text style={{ color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 8 }}>{fmtDate(student.last_attendance)}</Text><Text style={styles.muted}>última</Text></View>
      </View>

      <Text style={[styles.strong, { marginVertical: 8 }]}>Presenças (últimos 6 meses)</Text>
      {!detail && !error && <ActivityIndicator color={colors.amber} />}
      {detail && (
        <View style={styles.card}>
          <Text style={styles.muted}>{detail.attendance.length ? detail.attendance.map(fmtDate).join("  ·  ") : "Nenhuma presença registrada ainda."}</Text>
        </View>
      )}

      <Text style={[styles.strong, { marginVertical: 8 }]}>Histórico de faixa</Text>
      {detail && !detail.belt_history.length && <Text style={styles.muted}>Sem registros.</Text>}
      {detail?.belt_history.map((h, i) => (
        <View key={i} style={[styles.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <BeltBar belt={h.belt} stripes={h.stripes} />
          <Text style={styles.muted}>{fmtDate(h.at)}</Text>
        </View>
      ))}

      <Text style={[styles.strong, { marginVertical: 8 }]}>Mensagem para os mestres</Text>
      <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} placeholder="Sugestão, observação ou recado" placeholderTextColor={colors.muted} value={message} onChangeText={setMessage} multiline maxLength={1000} />
      <Button label="Enviar mensagem" onPress={send} busy={busy} disabled={!message.trim()} />
      <Button label="Desvincular este aluno" kind="secondary" onPress={unlink} />
    </ScrollView>
  );
}
