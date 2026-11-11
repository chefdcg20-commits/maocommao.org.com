import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { BELT_COLORS } from "./belts";
import { colors } from "./theme";

export const fmtDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

export function BeltBar({ belt, stripes = 0, width = 56 }: { belt: string | null; stripes?: number; width?: number }) {
  const info = belt ? BELT_COLORS[belt] : null;
  if (!info) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width, height: 10, borderRadius: 3, borderWidth: 1, backgroundColor: info.main, borderColor: info.stripe || colors.border }} />
      {stripes > 0 && <Text style={{ color: colors.muted, fontSize: 12 }}>{stripes}º grau</Text>}
    </View>
  );
}

export function Button({ label, onPress, busy, kind = "primary", disabled }: { label: string; onPress: () => void; busy?: boolean; kind?: "primary" | "secondary" | "danger"; disabled?: boolean }) {
  const bg = kind === "primary" ? colors.amber : colors.card;
  const border = kind === "danger" ? colors.red : kind === "secondary" ? colors.border : colors.amber;
  const fg = kind === "primary" ? "#020617" : kind === "danger" ? colors.red : colors.text;
  return (
    <Pressable onPress={onPress} disabled={busy || disabled} style={[styles.button, { backgroundColor: bg, borderColor: border }, (busy || disabled) && { opacity: 0.6 }]}>
      {busy ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Header({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Chips({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (key: string) => void }) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.chip, value === item.key && styles.chipOn]}>
          <Text style={[styles.chipText, value === item.key && { color: "#020617" }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingTop: 48, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  title: { color: colors.amber, fontSize: 28, fontWeight: "900" },
  sub: { color: colors.muted },
  link: { color: colors.muted, padding: 8 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  cardOn: { borderColor: colors.green },
  text: { color: colors.text, fontSize: 15 },
  strong: { color: colors.text, fontSize: 16, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 13 },
  error: { color: colors.red, textAlign: "center", marginVertical: 10 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, color: colors.text, padding: 12, fontSize: 16, marginBottom: 10 },
  button: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "center", marginBottom: 8 },
  buttonText: { fontWeight: "900", fontSize: 16 },
  chips: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { color: colors.text, fontWeight: "700" },
  photo: { width: 48, height: 60, borderRadius: 8 },
});
