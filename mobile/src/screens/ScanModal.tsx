import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { api, errorText, ScanResult, Student } from "../api";
import { cancelRead, nfcStatus, openNfcSettings, readUid } from "../nfc";
import { colors } from "../theme";

type Props = { mode: "attendance" | "link"; student?: Student; kind?: "card" | "belt"; onClose: (changed: boolean) => void };
type Shown = { kind: "ok" | "warn" | "error"; title: string; subtitle?: string; photo?: string | null };

// mode "attendance": le cartoes em sequencia e registra a presenca.
// mode "link": le um cartao e vincula ao aluno escolhido.
export default function ScanModal({ mode, student, kind = "card", onClose }: Props) {
  const [status, setStatus] = useState<"checking" | "ok" | "unsupported" | "disabled">("checking");
  const [shown, setShown] = useState<Shown | null>(null);
  const [count, setCount] = useState(0);
  const alive = useRef(true);
  const changed = useRef(false);

  const loop = useCallback(async () => {
    while (alive.current) {
      let uid: string;
      try {
        uid = await readUid();
      } catch {
        if (!alive.current) return;
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      if (!alive.current) return;
      try {
        if (mode === "link" && student) {
          await api({ action: "link_card", enrollment_id: student.id, tag_uid: uid, kind });
          changed.current = true;
          setShown({ kind: "ok", title: kind === "belt" ? "Chip da faixa vinculado!" : "Carteirinha vinculada!", subtitle: student.name, photo: student.photo_url });
          return;
        }
        const result = await api<ScanResult>({ action: "scan", tag_uid: uid });
        changed.current = true;
        if (!result.already_present) setCount((n) => n + 1);
        setShown({
          kind: result.already_present ? "warn" : "ok",
          title: result.already_present ? "Já estava presente" : "Presença registrada",
          subtitle: result.student.name,
          photo: result.student.photo_url,
        });
      } catch (error) {
        setShown({ kind: "error", title: errorText(error) });
        if (mode === "link") return;
      }
      await new Promise((r) => setTimeout(r, 2200));
      if (alive.current) setShown(null);
    }
  }, [mode, student, kind]);

  useEffect(() => {
    alive.current = true;
    nfcStatus()
      .then((s) => {
        if (!alive.current) return;
        setStatus(s);
        if (s === "ok") loop();
      })
      .catch(() => setStatus("unsupported"));
    return () => {
      alive.current = false;
      cancelRead();
    };
  }, [loop]);

  const tone = shown?.kind === "ok" ? colors.green : shown?.kind === "warn" ? colors.amber : shown ? colors.red : colors.border;

  return (
    <Modal animationType="slide" onRequestClose={() => onClose(changed.current)}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{mode === "link" ? `Vincular cartão\n${student?.name}` : "Chamada por chip"}</Text>
        {status === "unsupported" && <Text style={styles.msg}>Este celular não tem NFC.</Text>}
        {status === "disabled" && (
          <>
            <Text style={styles.msg}>O NFC está desligado.</Text>
            <Pressable style={styles.button} onPress={openNfcSettings}>
              <Text style={styles.buttonText}>Abrir configurações</Text>
            </Pressable>
          </>
        )}
        {status === "ok" && (
          <View style={[styles.panel, { borderColor: tone }]}>
            {shown ? (
              <>
                {!!shown.photo && <Image source={{ uri: shown.photo }} style={styles.photo} />}
                <Text style={[styles.big, { color: tone }]}>{shown.title}</Text>
                {!!shown.subtitle && <Text style={styles.name}>{shown.subtitle}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.nfc}>)))</Text>
                <Text style={styles.big}>Encoste o chip no celular</Text>
                <Text style={styles.msg}>{mode === "attendance" ? "Fica lendo em sequência." : "Aproxime a carteirinha ou a faixa da parte de trás do celular."}</Text>
              </>
            )}
          </View>
        )}
        {mode === "attendance" && status === "ok" && <Text style={styles.count}>{count} presença(s) nesta leitura</Text>}
        <Pressable style={[styles.button, styles.secondary]} onPress={() => onClose(changed.current)}>
          <Text style={[styles.buttonText, { color: colors.text }]}>{mode === "link" && shown?.kind === "ok" ? "Concluir" : "Fechar"}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center", gap: 16 },
  title: { color: colors.amber, fontSize: 22, fontWeight: "900", textAlign: "center" },
  panel: { borderWidth: 3, borderRadius: 24, padding: 24, alignItems: "center", gap: 10, minHeight: 280, justifyContent: "center", backgroundColor: colors.card },
  photo: { width: 120, height: 150, borderRadius: 14 },
  big: { color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  name: { color: colors.text, fontSize: 18, textAlign: "center" },
  nfc: { color: colors.amber, fontSize: 56, fontWeight: "900" },
  msg: { color: colors.muted, textAlign: "center", fontSize: 15 },
  count: { color: colors.muted, textAlign: "center" },
  button: { backgroundColor: colors.amber, borderRadius: 14, padding: 16, alignItems: "center" },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: "#020617", fontWeight: "900", fontSize: 16 },
});
