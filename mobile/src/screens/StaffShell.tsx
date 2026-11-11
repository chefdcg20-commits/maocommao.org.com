import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import AnnounceScreen from "./AnnounceScreen";
import InboxScreen from "./InboxScreen";
import ReportScreen from "./ReportScreen";
import RosterScreen from "./RosterScreen";

const TABS = [
  { key: "roster", label: "Chamada", icon: "✓" },
  { key: "report", label: "Relatório", icon: "▤" },
  { key: "inbox", label: "Mensagens", icon: "✉" },
  { key: "news", label: "Avisos", icon: "📢" },
] as const;

// Mestre: 4 abas. Professor: so a chamada.
export default function StaffShell({ role, onLogout }: { role: "mestre" | "professor"; onLogout: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("roster");

  if (role !== "mestre") return <RosterScreen role={role} onLogout={onLogout} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === "roster" && <RosterScreen role={role} onLogout={onLogout} />}
        {tab === "report" && <ReportScreen />}
        {tab === "inbox" && <InboxScreen />}
        {tab === "news" && <AnnounceScreen />}
      </View>
      <View style={styles.bar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.icon, tab === t.key && { color: colors.amber }]}>{t.icon}</Text>
            <Text style={[styles.label, tab === t.key && { color: colors.amber }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 14, paddingTop: 6 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 6 },
  icon: { color: colors.muted, fontSize: 20 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
});
