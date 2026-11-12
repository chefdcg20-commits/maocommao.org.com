import { ReactNode, useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, Role } from "../api";
import { colors } from "../theme";
import AnnounceScreen from "./AnnounceScreen";
import BraceletScreen from "./BraceletScreen";
import EnrollmentsScreen from "./EnrollmentsScreen";
import FamilyShell from "./FamilyShell";
import JornalScreen from "./JornalScreen";
import { ContactScreen, InfoScreen, LibraryScreen, NewsScreen } from "./InfoScreens";
import InboxScreen from "./InboxScreen";
import ReportScreen from "./ReportScreen";
import RosterScreen from "./RosterScreen";

type Screen = "hall" | "roster" | "enrollments" | "report" | "inbox" | "announce" | "news" | "students" | "info" | "library" | "contact" | "bracelet" | "jornal";
type Tile = { key: Screen; icon: string; label: string; hint?: string; badge?: number };

const ROLE_LABEL = { mestre: "Mestre", professor: "Professor", family: "Família" } as const;

// Hall de entrada: o que aparece depende de quem entrou (mestre, professor ou familia).
export default function Shell({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const [screen, setScreen] = useState<Screen>("hall");
  const [counts, setCounts] = useState({ pending: 0, unread: 0 });
  const kind = role.kind;
  const isStaff = kind === "mestre" || kind === "professor";
  const target = kind === "family" ? "family" : "staff";

  const refreshCounts = useCallback(() => {
    if (kind !== "mestre") return;
    api<{ pending: number; unread: number }>({ action: "summary" }).then(setCounts).catch(() => undefined);
  }, [kind]);

  useEffect(() => { if (screen === "hall") refreshCounts(); }, [screen, refreshCounts]);

  const mine: Tile[] =
    kind === "mestre"
      ? [
          { key: "roster", icon: "✅", label: "Chamada dos alunos", hint: "Leitura de chip e lista" },
          { key: "enrollments", icon: "📝", label: "Cadastros e carteirinhas", hint: "Aprovar alunos", badge: counts.pending },
          { key: "report", icon: "📊", label: "Relatório de presença" },
          { key: "inbox", icon: "✉️", label: "Mensagens", hint: "Dos pais e alunos", badge: counts.unread },
          { key: "announce", icon: "📢", label: "Avisos", hint: "Publicar e código" },
        ]
      : kind === "professor"
        ? [
            { key: "roster", icon: "✅", label: "Chamada dos alunos", hint: "Leitura de chip e lista" },
            { key: "news", icon: "📢", label: "Avisos" },
          ]
        : [
            { key: "students", icon: "🥋", label: "Meus alunos", hint: "Presenças e faixa" },
            { key: "news", icon: "📢", label: "Avisos" },
          ];

  const common: Tile[] = [
    { key: "info", icon: "ℹ️", label: "O projeto", hint: "Aulas, ações e documentos" },
    { key: "jornal", icon: "📰", label: "Jornal do Jiu-Jitsu", hint: "Resultados, competições e alertas" },
    { key: "library", icon: "📚", label: "Biblioteca", hint: "Videoaulas, técnicas e documentos" },
    { key: "contact", icon: "🤝", label: "Contato e apoio", hint: "Redes, mapa e PIX" },
  ];

  if (screen === "hall") {
    return (
      <ScrollView style={styles.hall} contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}>
        <View style={styles.top}>
          <Image source={require("../../assets/icon.png")} style={styles.logo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Olá{role.name ? `, ${role.name.split(" ")[0]}` : ""}!</Text>
            <Text style={styles.role}>{ROLE_LABEL[kind]} · Projeto Mão Com Mão</Text>
          </View>
          <Pressable onPress={onLogout}><Text style={styles.logout}>Sair</Text></Pressable>
        </View>

        {kind === "mestre" && (
          <>
            <Text style={styles.group}>Exclusivo dos mestres</Text>
            <Pressable style={styles.featured} onPress={() => setScreen("bracelet")} accessibilityRole="button" accessibilityLabel="Liberação da pulseira">
              <Text style={styles.featuredIcon}>📿</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredTitle}>LIBERAÇÃO DA PULSEIRA</Text>
                <Text style={styles.featuredText}>Ativa a pulseira antes do envio: você escaneia o chip e libera o acesso à Biblioteca. Só os mestres fazem isso.</Text>
              </View>
              <Text style={styles.featuredArrow}>›</Text>
            </Pressable>
          </>
        )}
        <Text style={styles.group}>{isStaff ? "Equipe" : "Acompanhamento"}</Text>
        <Grid tiles={mine} onPick={setScreen} />
        <Text style={styles.group}>Projeto</Text>
        <Grid tiles={common} onPick={setScreen} />
      </ScrollView>
    );
  }

  const back = () => setScreen("hall");
  const frame = (content: ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 44 }}>
      <Pressable onPress={back} style={styles.back}><Text style={styles.backText}>‹ Início</Text></Pressable>
      <View style={{ flex: 1 }}>{content}</View>
    </View>
  );

  switch (screen) {
    case "roster": return frame(<RosterScreen role={kind === "mestre" ? "mestre" : "professor"} onLogout={onLogout} />);
    case "enrollments": return frame(<EnrollmentsScreen />);
    case "bracelet": return frame(<BraceletScreen />);
    case "report": return frame(<ReportScreen />);
    case "inbox": return frame(<InboxScreen />);
    case "announce": return frame(<AnnounceScreen />);
    case "news": return frame(<NewsScreen target={target} />);
    case "students": return frame(<FamilyShell onLogout={onLogout} />);
    case "info": return frame(<InfoScreen target={target} canEdit={kind === "mestre"} />);
    case "library": return frame(<LibraryScreen target={target} canEdit={kind === "mestre"} />);
    case "jornal": return frame(<JornalScreen target={target} canEdit={kind === "mestre"} />);
    case "contact": return frame(<ContactScreen />);
    default: return null;
  }
}

function Grid({ tiles, onPick }: { tiles: Tile[]; onPick: (key: Screen) => void }) {
  return (
    <View style={styles.grid}>
      {tiles.map((t) => (
        <Pressable key={t.key} style={styles.tile} onPress={() => onPick(t.key)}>
          <Text style={styles.icon}>{t.icon}</Text>
          <Text style={styles.label}>{t.label}</Text>
          {!!t.hint && <Text style={styles.hint}>{t.hint}</Text>}
          {!!t.badge && <View style={styles.badge}><Text style={styles.badgeText}>{t.badge}</Text></View>}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hall: { flex: 1, backgroundColor: colors.bg },
  featured: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.amber, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: "#fde68a" },
  featuredIcon: { fontSize: 34 },
  featuredTitle: { color: "#020617", fontSize: 17, fontWeight: "900", letterSpacing: 1 },
  featuredText: { color: "#1e293b", fontSize: 13, marginTop: 3, lineHeight: 18 },
  featuredArrow: { color: "#020617", fontSize: 30, fontWeight: "900" },
  top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  logo: { width: 56, height: 56, borderRadius: 28 },
  hello: { color: colors.amber, fontSize: 24, fontWeight: "900" },
  role: { color: colors.muted },
  logout: { color: colors.muted, padding: 8 },
  group: { color: colors.muted, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginTop: 22, marginBottom: 10, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47.5%", minHeight: 118, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14, justifyContent: "flex-end" },
  icon: { fontSize: 30, marginBottom: 8 },
  label: { color: colors.text, fontSize: 16, fontWeight: "800" },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { position: "absolute", top: 10, right: 10, minWidth: 26, height: 26, borderRadius: 13, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText: { color: "#020617", fontWeight: "900" },
  back: { paddingHorizontal: 16, paddingVertical: 6, alignSelf: "flex-start" },
  backText: { color: colors.amber, fontWeight: "800", fontSize: 16 },
});
