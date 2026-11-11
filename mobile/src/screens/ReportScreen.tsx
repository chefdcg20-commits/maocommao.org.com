import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { api, errorText, Report } from "../api";
import { colors } from "../theme";
import { BeltBar, Chips, fmtDate, Header, styles } from "../ui";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function range(key: string) {
  const now = new Date();
  if (key === "last") return { from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: iso(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (key === "30") return { from: iso(new Date(now.getTime() - 29 * 86400000)), to: iso(now) };
  return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
}

// Relatorio de presenca (so mestres): presencas por aluno no periodo, com filtro de horario.
export default function ReportScreen() {
  const [period, setPeriod] = useState("month");
  const [time, setTime] = useState("all");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = range(period);
      setReport(await api<Report>({ action: "attendance_report", from, to, training_time: time === "all" ? null : time }));
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [period, time]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => [...(report?.students || [])].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)), [report]);
  const days = report?.training_days || 0;

  return (
    <View style={styles.screen}>
      <Header title="Relatório" sub={report ? `${fmtDate(report.from)} a ${fmtDate(report.to)} · ${days} dia(s) de treino` : undefined} />
      <Chips value={period} onChange={setPeriod} items={[{ key: "month", label: "Este mês" }, { key: "last", label: "Mês passado" }, { key: "30", label: "30 dias" }]} />
      <Chips value={time} onChange={setTime} items={[{ key: "all", label: "Todos" }, { key: "18:00", label: "18h" }, { key: "19:00", label: "19h" }, { key: "20:00", label: "20h" }]} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && !report ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(s) => s.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum aluno no período.</Text>}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => {
            const pct = days ? Math.round((item.count / days) * 100) : 0;
            return (
              <Pressable style={styles.card} onPress={() => setOpen(open === item.id ? null : item.id)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[styles.strong, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ color: item.count ? colors.green : colors.red, fontWeight: "900", fontSize: 18 }}>{item.count}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 }}>
                  <Text style={styles.muted}>{item.training_time ? `${item.training_time.slice(0, 2)}h` : "sem horário"}</Text>
                  <BeltBar belt={item.belt} stripes={item.belt_stripes} width={28} />
                  <Text style={[styles.muted, { marginLeft: "auto" }]}>{days ? `${pct}% · ` : ""}última: {fmtDate(item.last)}</Text>
                </View>
                {open === item.id && (
                  <Text style={[styles.muted, { marginTop: 8 }]}>
                    {item.dates.length ? item.dates.map(fmtDate).join("  ·  ") : "Nenhuma presença no período."}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
