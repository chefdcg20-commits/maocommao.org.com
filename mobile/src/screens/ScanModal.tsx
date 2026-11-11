import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { api, errorText, ScanResult, Student } from "../api";
import { cancelRead, nfcStatus, openNfcSettings, readUid, writeUrl } from "../nfc";
import ScannerView, { ScanState } from "../ScannerView";
import { colors } from "../theme";

type Props = { mode: "attendance" | "link"; student?: Student; kind?: "card" | "belt"; onClose: (changed: boolean) => void };
type Shown = { state: Exclude<ScanState, "idle">; title: string; subtitle?: string; photo?: string | null };

// mode "attendance": le chips em sequencia e registra a presenca.
// mode "link": le um chip, vincula ao aluno e grava nele o acesso a biblioteca do aluno.
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
          const title = kind === "belt" ? "Chip da faixa vinculado!" : "Carteirinha vinculada!";
          setShown({ state: "ok", title, subtitle: "Mantenha encostado: gravando o acesso à biblioteca...", photo: student.photo_url });
          try {
            const { url } = await api<{ url: string }>({ action: "student_key", enrollment_id: student.id });
            await writeUrl(url, uid);
            if (alive.current) setShown({ state: "ok", title, subtitle: `${student.name}\nAcesso à biblioteca gravado no chip.`, photo: student.photo_url });
          } catch {
            if (alive.current) setShown({ state: "ok", title, subtitle: `${student.name}\nO acesso à biblioteca não foi gravado (o chip pode ser só de leitura). A chamada funciona normalmente.`, photo: student.photo_url });
          }
          return;
        }
        const result = await api<ScanResult>({ action: "scan", tag_uid: uid });
        changed.current = true;
        if (!result.already_present) setCount((n) => n + 1);
        setShown({
          state: result.already_present ? "warn" : "ok",
          title: result.already_present ? "Já estava presente" : "Presença registrada",
          subtitle: result.student.name,
          photo: result.student.photo_url,
        });
      } catch (error) {
        setShown({ state: "error", title: errorText(error) });
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

  const tone = shown?.state === "ok" ? colors.green : shown?.state === "warn" ? colors.amber : shown ? colors.red : colors.text;

  return (
    <Modal animationType="slide" onRequestClose={() => onClose(changed.current)}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{mode === "link" ? `${kind === "belt" ? "Vincular chip da faixa" : "Vincular carteirinha"}\n${student?.name}` : "Chamada por chip"}</Text>
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
          <View style={styles.panel}>
            <ScannerView state={shown ? shown.state : "idle"} />
            {shown ? (
              <>
                {!!shown.photo && <Image source={{ uri: shown.photo }} style={styles.photo} />}
                <Text style={[styles.big, { color: tone }]}>{shown.title}</Text>
                {!!shown.subtitle && <Text style={styles.name}>{shown.subtitle}</Text>}
              </>
            ) : (
              <>
                <Text style={styles.big}>Encoste o chip no celular</Text>
                <Text style={styles.msg}>{mode === "attendance" ? "Fica lendo em sequência." : "Aproxime a carteirinha ou a faixa da parte de trás do celular."}</Text>
              </>
            )}
          </View>
        )}
        {mode === "attendance" && status === "ok" && <Text style={styles.count}>{count} presença(s) nesta leitura</Text>}
        <Pressable style={[styles.button, styles.secondary]} onPress={() => onClose(changed.current)}>
          <Text style={[styles.buttonText, { color: colors.text }]}>{mode === "link" && shown?.state === "ok" ? "Concluir" : "Fechar"}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center", gap: 16 },
  title: { color: colors.amber, fontSize: 22, fontWeight: "900", textAlign: "center" },
  panel: { borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: 20, alignItems: "center", gap: 10, minHeight: 300, justifyContent: "center", backgroundColor: colors.card },
  photo: { width: 96, height: 120, borderRadius: 14 },
  big: { color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" },
  name: { color: colors.text, fontSize: 16, textAlign: "center" },
  msg: { color: colors.muted, textAlign: "center", fontSize: 15 },
  count: { color: colors.muted, textAlign: "center" },
  button: { backgroundColor: colors.amber, borderRadius: 14, padding: 16, alignItems: "center" },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: "#020617", fontWeight: "900", fontSize: 16 },
});
