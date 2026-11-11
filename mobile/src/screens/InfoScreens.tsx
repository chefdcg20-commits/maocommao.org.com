import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { Announcement, api, ApiError, errorText, Section, Target } from "../api";
import { CNPJ, LINKS, PIX_KEY } from "../info";
import { colors } from "../theme";
import { Button, fmtDate, Header, styles } from "../ui";

// O projeto: secoes de texto vindas do servidor. Mestres editam aqui mesmo, sem novo APK.
export function InfoScreen({ target, canEdit }: { target: Target; canEdit: boolean }) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setSections((await api<{ sections: Section[] }>({ action: "content" }, target)).sections);
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  function edit(section: Section) {
    setEditing(section.slug); setTitle(section.title); setBody(section.body);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      await api({ action: "save_content", slug: editing, title, body });
      setEditing(null);
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Header title="O projeto" sub="Mão Com Mão · Diadema, SP" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {sections === null && !error && <ActivityIndicator color={colors.amber} style={{ marginTop: 30 }} />}
      {sections?.map((s) =>
        editing === s.slug ? (
          <View key={s.slug} style={styles.card}>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.muted} maxLength={120} />
            <TextInput style={[styles.input, { minHeight: 180, textAlignVertical: "top" }]} value={body} onChangeText={setBody} multiline placeholder="Texto" placeholderTextColor={colors.muted} maxLength={6000} />
            <Button label="Salvar" onPress={save} busy={busy} />
            <Button label="Cancelar" kind="secondary" onPress={() => setEditing(null)} />
          </View>
        ) : (
          <View key={s.slug} style={styles.card}>
            <Text style={[styles.strong, { color: colors.amber, fontSize: 18 }]}>{s.title}</Text>
            <Text style={[styles.text, { marginTop: 8, lineHeight: 22 }]}>{s.body}</Text>
            {canEdit && <Pressable onPress={() => edit(s)}><Text style={{ color: colors.muted, marginTop: 10 }}>✎ Editar este texto</Text></Pressable>}
          </View>
        ),
      )}
    </ScrollView>
  );
}

// Avisos publicados pelos mestres (leitura).
export function NewsScreen({ target }: { target: Target }) {
  const [list, setList] = useState<Announcement[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const action = target === "family" ? "announcements" : "announcements_list";
      setList((await api<{ announcements: Announcement[] }>({ action }, target)).announcements);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}>
      <Header title="Avisos" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {list === null && !error && <ActivityIndicator color={colors.amber} style={{ marginTop: 30 }} />}
      {list?.length === 0 && <Text style={styles.empty}>Nenhum aviso no momento.</Text>}
      {list?.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.strong}>{a.title}</Text>
          <Text style={styles.muted}>{fmtDate(a.created_at)}</Text>
          <Text style={[styles.text, { marginTop: 6 }]}>{a.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const open = (url: string) => Linking.openURL(url).catch(() => undefined);

// Contato, redes, endereco, documentos e doacao.
export function ContactScreen() {
  const rows: [string, string, string][] = [
    ["💬", "Entrar no grupo do WhatsApp", LINKS.group],
    ["👤", "Falar com o Daniel", LINKS.daniel],
    ["📸", "Instagram", LINKS.instagram],
    ["👍", "Facebook", LINKS.facebook],
    ["📍", "Como chegar (Google Maps)", LINKS.maps],
    ["🌐", "Site do projeto", LINKS.site],
    ["📄", "Estatuto social (PDF)", LINKS.statute],
  ];
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <Header title="Contato e apoio" sub="Associação Mão Com Mão" />
      <View style={styles.card}>
        <Text style={styles.strong}>Ginásio Poliesportivo Rômulo Duncan Arantes</Text>
        <Text style={styles.muted}>Av. Casa Grande, 485 — Diadema, SP</Text>
        <Text style={[styles.muted, { marginTop: 6 }]}>CNPJ: {CNPJ}</Text>
      </View>
      {rows.map(([icon, label, url]) => (
        <Pressable key={label} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]} onPress={() => open(url)}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
          <Text style={[styles.text, { flex: 1 }]}>{label}</Text>
          <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
        </Pressable>
      ))}
      <View style={[styles.card, { borderColor: colors.amber }]}>
        <Text style={[styles.strong, { color: colors.amber }]}>Apoie o projeto com PIX</Text>
        <Text style={[styles.muted, { marginVertical: 6 }]}>Chave PIX (CNPJ da associação). Segure o dedo sobre a chave para copiar.</Text>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 10 }}>{PIX_KEY}</Text>
        <Button label="Enviar comprovante no WhatsApp" onPress={() => open(LINKS.receipt)} />
      </View>
    </ScrollView>
  );
}

export { ApiError };
