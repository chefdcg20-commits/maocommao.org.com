import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { api, errorText, NewsPost, Target } from "../api";
import { colors } from "../theme";
import { Button, fmtDate, Header, styles } from "../ui";

const CATS: [string, string, string][] = [
  ["resultados", "🏆", "Resultados"],
  ["calendario", "📅", "Calendário"],
  ["alertas", "🚨", "Alertas"],
  ["noticias", "📰", "Notícias"],
];
const catLabel = (key: string) => CATS.find((c) => c[0] === key);

// Jornal do Jiu-Jitsu: resultados, calendario de competicoes, alertas para atletas e noticias.
// Todos leem; so os mestres publicam. O texto e um resumo proprio, com o link da fonte.
export default function JornalScreen({ target, canEdit }: { target: Target; canEdit: boolean }) {
  const [posts, setPosts] = useState<NewsPost[] | null>(null);
  const [filter, setFilter] = useState("todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<NewsPost> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts((await api<{ posts: NewsPost[] }>({ action: "news" }, target)).posts);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form) return;
    if (!form.title?.trim()) return setError("Escreva o título.");
    setBusy(true);
    try {
      await api({ action: "news_save", id: form.id, category: form.category || "noticias", title: form.title, summary: form.summary, source_name: form.source_name, source_url: form.source_url, event_date: form.event_date, pinned: !!form.pinned });
      setForm(null);
      setError("");
      await load();
    } catch (e) {
      setError(errorText(e) === "invalid_url" ? "O link precisa começar com https://" : errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function remove(post: NewsPost) {
    Alert.alert("Remover esta notícia?", post.title, [
      { text: "Não", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => { try { await api({ action: "news_remove", id: post.id }); await load(); } catch (e) { setError(errorText(e)); } } },
    ]);
  }

  const set = (patch: Partial<NewsPost>) => setForm((f) => ({ ...f, ...patch }));
  const shown = posts?.filter((p) => filter === "todos" || p.category === filter);

  if (form) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 90 }} keyboardShouldPersistTaps="handled">
        <Header title={form.id ? "Editar notícia" : "Nova notícia"} sub="Escreva um resumo com as suas palavras e cite a fonte" />
        <View style={styles.card}>
          <Text style={[styles.muted, { marginBottom: 6 }]}>Tipo</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {CATS.map(([key, icon, label]) => (
              <Pressable key={key} onPress={() => set({ category: key })} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: (form.category || "noticias") === key ? colors.amber : colors.border, backgroundColor: (form.category || "noticias") === key ? colors.amber : "transparent" }}>
                <Text style={{ color: (form.category || "noticias") === key ? "#000" : colors.text, fontWeight: "700" }}>{icon} {label}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={styles.input} value={form.title || ""} onChangeText={(v) => set({ title: v })} placeholder="Título" placeholderTextColor={colors.muted} maxLength={160} />
          <TextInput style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]} value={form.summary || ""} onChangeText={(v) => set({ summary: v })} multiline placeholder="Resumo (com as suas palavras)" placeholderTextColor={colors.muted} maxLength={1200} />
          <TextInput style={styles.input} value={form.source_name || ""} onChangeText={(v) => set({ source_name: v })} placeholder="Fonte (ex.: CBJJ, IBJJF)" placeholderTextColor={colors.muted} maxLength={80} />
          <TextInput style={styles.input} value={form.source_url || ""} onChangeText={(v) => set({ source_url: v })} placeholder="Link da fonte (https://...)" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="url" />
          <TextInput style={styles.input} value={form.event_date || ""} onChangeText={(v) => set({ event_date: v })} placeholder="Data do evento (AAAA-MM-DD), se houver" placeholderTextColor={colors.muted} maxLength={10} />
          <Pressable onPress={() => set({ pinned: !form.pinned })} style={{ paddingVertical: 8 }}>
            <Text style={styles.text}>{form.pinned ? "☑" : "☐"} Fixar no topo</Text>
          </Pressable>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button label="Publicar" onPress={save} busy={busy} />
          <Button label="Cancelar" kind="secondary" onPress={() => { setForm(null); setError(""); }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 90 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}>
      <Header title="Jornal do Jiu-Jitsu" sub="Resultados, competições, alertas e notícias" />
      {canEdit && <Button label="+ Nova notícia" onPress={() => setForm({ category: "noticias" })} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
        {[["todos", "", "Todas"] as [string, string, string], ...CATS].map(([key, icon, label]) => (
          <Pressable key={key} onPress={() => setFilter(key)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: filter === key ? colors.amber : colors.border, backgroundColor: filter === key ? colors.amber : "transparent" }}>
            <Text style={{ color: filter === key ? "#000" : colors.text, fontWeight: "700" }}>{icon} {label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {posts === null && !error && <ActivityIndicator color={colors.amber} style={{ marginTop: 30 }} />}
      {shown?.length === 0 && <Text style={styles.empty}>Nenhuma notícia por aqui ainda.</Text>}
      {shown?.map((p) => {
        const c = catLabel(p.category);
        return (
          <View key={p.id} style={[styles.card, p.pinned ? { borderColor: colors.amber } : null]}>
            <Text style={styles.muted}>{c ? `${c[1]} ${c[2]}` : p.category}{p.pinned ? "  · 📌 fixada" : ""}</Text>
            <Text style={[styles.strong, { fontSize: 17, marginTop: 4 }]}>{p.title}</Text>
            <Text style={styles.muted}>{p.event_date ? `Evento: ${fmtDate(p.event_date)} · ` : ""}Publicado em {fmtDate(p.created_at)}</Text>
            {!!p.summary && <Text style={[styles.text, { marginTop: 6, lineHeight: 21 }]}>{p.summary}</Text>}
            {!!p.source_url && <View style={{ marginTop: 8 }}><Button label={`Ler na fonte${p.source_name ? ` (${p.source_name})` : ""}`} kind="secondary" onPress={() => Linking.openURL(p.source_url as string).catch(() => undefined)} /></View>}
            {canEdit && (
              <View style={{ flexDirection: "row", gap: 18, marginTop: 8 }}>
                <Text onPress={() => setForm(p)} style={{ color: colors.muted }}>✎ Editar</Text>
                <Text onPress={() => remove(p)} style={{ color: colors.red }}>Remover</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
