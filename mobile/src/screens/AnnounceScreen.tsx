import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Announcement, api, ApiError, errorText } from "../api";
import { colors } from "../theme";
import { Button, fmtDate, Header, styles } from "../ui";

// Avisos para a familia e codigo de cadastro do grupo (so mestres).
export default function AnnounceScreen() {
  const [list, setList] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([api<{ announcements: Announcement[] }>({ action: "announcements_list" }), api<{ code: string }>({ action: "get_signup_code" })]);
      setList(a.announcements);
      setCode(c.code);
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!title.trim() || !text.trim()) return setError("Escreva o título e o texto.");
    setBusy(true);
    try {
      await api({ action: "announce", title, body: text });
      setTitle(""); setText("");
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function remove(item: Announcement) {
    Alert.alert("Remover aviso?", item.title, [
      { text: "Não", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => { try { await api({ action: "remove_announcement", id: item.id }); await load(); } catch (e) { setError(errorText(e)); } } },
    ]);
  }

  async function changeCode() {
    try {
      const result = await api<{ code: string }>({ action: "set_signup_code", code: newCode });
      setCode(result.code); setNewCode("");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "invalid_code" ? "O código precisa ter de 6 a 24 letras, números ou hífen." : errorText(e));
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <Header title="Avisos" sub="Para pais e alunos" />
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.strong}>Código de cadastro da família</Text>
        <Text style={{ color: colors.amber, fontSize: 26, fontWeight: "900", marginVertical: 6 }} selectable>{code || "..."}</Text>
        <Text style={styles.muted}>Mande só no grupo. Quem não tiver o código não consegue criar conta.</Text>
        <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Novo código (opcional)" placeholderTextColor={colors.muted} autoCapitalize="characters" value={newCode} onChangeText={setNewCode} />
        <Button label="Trocar código" kind="secondary" onPress={changeCode} disabled={newCode.trim().length < 6} />
      </View>

      <Text style={[styles.strong, { marginVertical: 8 }]}>Novo aviso</Text>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} maxLength={120} />
      <TextInput style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} placeholder="Texto do aviso" placeholderTextColor={colors.muted} value={text} onChangeText={setText} multiline maxLength={2000} />
      <Button label="Publicar aviso" onPress={publish} busy={busy} />

      <Text style={[styles.strong, { marginVertical: 8 }]}>Avisos publicados</Text>
      {!list.length && <Text style={styles.empty}>Nenhum aviso.</Text>}
      {list.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.strong}>{item.title}</Text>
          <Text style={styles.muted}>{fmtDate(item.created_at)}</Text>
          <Text style={[styles.text, { marginVertical: 6 }]}>{item.body}</Text>
          <Button label="Remover" kind="danger" onPress={() => remove(item)} />
        </View>
      ))}
    </ScrollView>
  );
}
