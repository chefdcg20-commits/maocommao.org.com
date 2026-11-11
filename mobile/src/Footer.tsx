import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { LINKS } from "./info";
import { colors } from "./theme";

const ITEMS: [string, string, string][] = [
  ["🌐", "Site", LINKS.site],
  ["📸", "Instagram", LINKS.instagram],
  ["👍", "Facebook", LINKS.facebook],
  ["💬", "Grupo", LINKS.group],
  ["📍", "Mapa", LINKS.maps],
];

// Rodape fixo em todas as telas: o app, o site e as redes ficam sempre ligados.
export default function Footer() {
  return (
    <View style={styles.bar}>
      {ITEMS.map(([icon, label, url]) => (
        <Pressable key={label} style={styles.item} onPress={() => Linking.openURL(url).catch(() => undefined)} accessibilityLabel={label}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, paddingBottom: 14 },
  item: { flex: 1, alignItems: "center", paddingVertical: 4 },
  icon: { fontSize: 18 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 1 },
});
