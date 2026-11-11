import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { api, errorText, Student } from "../api";
import { BELT_COLORS } from "../belts";
import { colors } from "../theme";
import ScanModal from "./ScanModal";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "18:00", label: "18h" },
  { key: "19:00", label: "19h" },
  { key: "20:00", label: "20h" },
];

export default function RosterScreen({ onLogout }: { onLogout: () => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState("");
  const [role, setRole] = useState<"mestre" | "professor">("professor");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<null | { mode: "attendance" | "link"; student?: Student }>(null);

  const load = useCallback(async () => {
    try {
      const [me, roster] = await Promise.all([api({ action: "me" }), api({ action: "roster" })]);
      setRole(me.role);
      setStudents(roster.students);
      setDate(roster.date);
      setError("");
    } catch (e) {
      const text = errorText(e);
      setError(text);
      if (text.startsWith("Sessão expirada")) onLogout();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => (filter === "all" || s.training_time === filter) && (!q || s.name.toLowerCase().includes(q)));
  }, [students, filter, query]);

  const presentCount = visible.filter((s) => s.present_today).length;

  async function mark(student: Student) {
    try {
      if (student.present_today) {
        Alert.alert("Desfazer presença?", student.name, [
          { text: "Não", style: "cancel" },
          {
            text: "Desfazer",
            style: "destructive",
            onPress: async () => {
              try {
                await api({ action: "undo_attendance", enrollment_id: student.id });
                setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, present_today: false } : s)));
              } catch (e) {
                Alert.alert("Erro", errorText(e));
              }
            },
          },
        ]);
        return;
      }
      await api({ action: "mark_attendance", enrollment_id: student.id });
      setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, present_today: true } : s)));
    } catch (e) {
      Alert.alert("Erro", errorText(e));
    }
  }

  function menu(student: Student) {
    const buttons: { text: string; style?: "cancel" | "destructive"; onPress?: () => void }[] = [
      { text: student.has_card ? "Trocar cartão" : "Vincular cartão", onPress: () => setScan({ mode: "link", student }) },
    ];
    if (role === "mestre" && student.has_card) {
      buttons.push({
        text: "Cartão perdido (desativar)",
        style: "destructive",
        onPress: async () => {
          try {
            await api({ action: "revoke_card", enrollment_id: student.id, reason: "lost" });
            await load();
          } catch (e) {
            Alert.alert("Erro", errorText(e));
          }
        },
      });
    }
    buttons.push({ text: "Cancelar", style: "cancel" });
    Alert.alert(student.name, student.has_card ? "Cartão vinculado." : "Sem cartão vinculado.", buttons);
  }

  const dateLabel = date ? date.split("-").reverse().join("/") : "";

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chamada</Text>
          <Text style={styles.sub}>{dateLabel} · {role === "mestre" ? "Mestre" : "Professor"}</Text>
        </View>
        <Pressable onPress={onLogout}><Text style={styles.logout}>Sair</Text></Pressable>
      </View>

      <TextInput style={styles.search} placeholder="Buscar aluno" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} />
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipOn]}>
            <Text style={[styles.chipText, filter === f.key && { color: "#020617" }]}>{f.label}</Text>
          </Pressable>
        ))}
        <Text style={styles.counter}>{presentCount}/{visible.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(s) => s.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.amber} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : undefined}
          ListEmptyComponent={!error ? <Text style={styles.empty}>Nenhum aluno encontrado.</Text> : undefined}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => {
            const belt = item.belt ? BELT_COLORS[item.belt] : null;
            return (
              <Pressable style={[styles.row, item.present_today && styles.rowOn]} onPress={() => mark(item)} onLongPress={() => menu(item)} delayLongPress={450}>
                {item.photo_url ? <Image source={{ uri: item.photo_url }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.border }]} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.meta}>
                    <Text style={styles.metaText}>{item.training_time ? `${item.training_time.slice(0, 2)}h` : "sem horário"}</Text>
                    {belt && <View style={[styles.beltDot, { backgroundColor: belt.main, borderColor: belt.stripe || colors.border }]} />}
                    <Text style={styles.metaText}>{item.has_card ? "💳" : "sem cartão"}</Text>
                  </View>
                </View>
                <Text style={[styles.check, item.present_today && { color: colors.green }]}>{item.present_today ? "✓" : "○"}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => setScan({ mode: "attendance" })}>
        <Text style={styles.fabText}>Ler cartão (NFC)</Text>
      </Pressable>

      {scan && (
        <ScanModal
          mode={scan.mode}
          student={scan.student}
          onClose={(changed) => {
            setScan(null);
            if (changed) load();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 48, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { color: colors.amber, fontSize: 28, fontWeight: "900" },
  sub: { color: colors.muted },
  logout: { color: colors.muted, padding: 8 },
  search: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, color: colors.text, padding: 12, fontSize: 16, marginBottom: 10 },
  chips: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { color: colors.text, fontWeight: "700" },
  counter: { color: colors.muted, marginLeft: "auto", fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rowOn: { borderColor: colors.green },
  photo: { width: 48, height: 60, borderRadius: 8 },
  name: { color: colors.text, fontSize: 16, fontWeight: "800" },
  meta: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 },
  metaText: { color: colors.muted, fontSize: 13 },
  beltDot: { width: 28, height: 8, borderRadius: 3, borderWidth: 1 },
  check: { color: colors.muted, fontSize: 26, paddingHorizontal: 6 },
  error: { color: colors.red, textAlign: "center", marginVertical: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  fab: { position: "absolute", left: 16, right: 16, bottom: 24, backgroundColor: colors.amber, borderRadius: 18, padding: 18, alignItems: "center" },
  fabText: { color: "#020617", fontWeight: "900", fontSize: 18 },
});
