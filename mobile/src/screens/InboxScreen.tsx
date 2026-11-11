import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { api, errorText, InboxMessage } from "../api";
import { colors } from "../theme";
import { fmtDate, Header, styles } from "../ui";

// Mensagens e sugestoes enviadas pelos pais/alunos (so mestres).
export default function InboxScreen() {
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await api<{ messages: InboxMessage[] }>({ action: "inbox" })).messages);
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function read(item: InboxMessage) {
    if (item.read) return;
    try {
      await api({ action: "mark_message_read", id: item.id });
      setItems((list) => list.map((m) => (m.id === item.id ? { ...m, read: true } : m)));
    } catch { /* tenta de novo no proximo toque */ }
  }

  const unread = items.filter((m) => !m.read).length;

  return (
    <View style={styles.screen}>
      <Header title="Mensagens" sub={unread ? `${unread} não lida(s)` : "Tudo lido"} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading && !items.length ? (
        <ActivityIndicator color={colors.amber} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.amber} />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma mensagem ainda.</Text>}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, !item.read && { borderColor: colors.amber }]} onPress={() => read(item)}>
              <Text style={styles.strong}>{item.student}</Text>
              <Text style={styles.muted}>de {item.from} · {fmtDate(item.created_at)}</Text>
              <Text style={[styles.text, { marginTop: 6 }]}>{item.body}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
