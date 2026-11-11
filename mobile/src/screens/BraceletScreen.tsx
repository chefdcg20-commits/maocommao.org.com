import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, ScrollView, Share, Text, View } from "react-native";
import { api, BraceletRow, errorText } from "../api";
import { LINKS } from "../info";
import { cancelRead, nfcStatus, openNfcSettings, readUid, writeUrl } from "../nfc";
import ScannerView, { ScanState } from "../ScannerView";
import { colors } from "../theme";
import { Button, fmtDate, Header, styles } from "../ui";

type Phase = "ready" | "scanning" | "result";
type Result = { state: Exclude<ScanState, "idle">; title: string; subtitle?: string; url?: string };

// LIBERACAO DA PULSEIRA (so mestres): le o chip da pulseira, cria o codigo de acesso a biblioteca,
// grava o endereco no chip e deixa o link/QR pronto para o envio. A palavra OSS! fica verde ao concluir.
export default function BraceletScreen() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [result, setResult] = useState<Result | null>(null);
  const [list, setList] = useState<{ total: number; active: number; bracelets: BraceletRow[] } | null>(null);
  const [error, setError] = useState("");
  const alive = useRef(true);

  const loadList = useCallback(async () => {
    try {
      setList(await api({ action: "bracelet_list" }));
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    loadList();
    return () => { alive.current = false; cancelRead(); };
  }, [loadList]);

  async function start() {
    setError("");
    setResult(null);
    let nfc: Awaited<ReturnType<typeof nfcStatus>>;
    try { nfc = await nfcStatus(); } catch { nfc = "unsupported"; }
    if (nfc === "unsupported") return setError("Este celular não tem NFC.");
    if (nfc === "disabled") {
      Alert.alert("NFC desligado", "Ligue o NFC para ler a pulseira.", [{ text: "Abrir configurações", onPress: openNfcSettings }, { text: "Cancelar", style: "cancel" }]);
      return;
    }
    setPhase("scanning");
    try {
      const uid = await readUid();
      if (!alive.current) return;
      const res = await api<{ already: boolean; label: string; url: string }>({ action: "bracelet_issue", tag_uid: uid });
      setResult({ state: res.already ? "warn" : "ok", title: res.already ? `${res.label} já estava liberada` : `${res.label} liberada!`, subtitle: "Mantenha encostada: gravando o acesso no chip...", url: res.url });
      setPhase("result");
      try {
        await writeUrl(res.url, uid);
        if (alive.current) setResult({ state: res.already ? "warn" : "ok", title: res.already ? `${res.label} já estava liberada` : `${res.label} liberada!`, subtitle: "Acesso gravado no chip. Encostar o celular na pulseira abre a Biblioteca.", url: res.url });
      } catch {
        if (alive.current) setResult({ state: "warn", title: `${res.label} liberada`, subtitle: "Não consegui gravar o endereço no chip. O QR Code funciona. Para gravar no chip, escaneie de novo.", url: res.url });
      }
      loadList();
    } catch (e) {
      if (!alive.current) return;
      setResult({ state: "error", title: errorText(e) });
      setPhase("result");
    }
  }

  function cancel() {
    cancelRead();
    setPhase("ready");
  }

  function revoke(row: BraceletRow) {
    Alert.alert(`Desativar ${row.label}?`, "O QR Code e o chip dessa pulseira deixam de abrir a biblioteca.", [
      { text: "Não", style: "cancel" },
      { text: "Desativar", style: "destructive", onPress: async () => { try { await api({ action: "bracelet_revoke", id: row.id }); await loadList(); } catch (e) { setError(errorText(e)); } } },
    ]);
  }

  const scanState: ScanState = phase === "result" && result ? result.state : "idle";
  const tone = result?.state === "ok" ? colors.green : result?.state === "warn" ? colors.amber : result ? colors.red : colors.text;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 90 }}>
      <Header title="Liberação da pulseira" sub="Exclusivo dos mestres" />
      <View style={[styles.card, { borderColor: colors.amber }]}>
        <Text style={[styles.strong, { color: colors.amber }]}>O que é isto?</Text>
        <Text style={[styles.text, { marginTop: 4, lineHeight: 21 }]}>
          É o passo que ATIVA uma pulseira antes de ela ser enviada. Sem esta liberação, a pulseira não abre a Biblioteca.
        </Text>
        <Text style={[styles.strong, { color: colors.amber, marginTop: 10 }]}>Como fazer</Text>
        <Text style={[styles.text, { marginTop: 4, lineHeight: 21 }]}>
          1. Toque em "Escanear pulseira".{"\n"}2. Encoste a pulseira na parte de trás do celular e espere a palavra OSS! ficar verde.{"\n"}3. Imprima o QR Code dessa pulseira e envie junto com ela.
        </Text>
        <Text style={[styles.muted, { marginTop: 8 }]}>Quem recebe a pulseira entra na Biblioteca encostando o celular nela ou lendo o QR Code.</Text>
      </View>
      <View style={[styles.card, { alignItems: "center", paddingVertical: 18, gap: 8 }]}>
        <ScannerView state={phase === "ready" ? "idle" : scanState} />
        {phase === "ready" && <Text style={[styles.text, { textAlign: "center" }]}>Encoste a pulseira no celular para liberar o acesso à Biblioteca.</Text>}
        {phase === "scanning" && <Text style={[styles.strong, { textAlign: "center" }]}>Encoste a pulseira no celular...</Text>}
        {phase === "result" && result && (
          <>
            <Text style={[styles.strong, { color: tone, fontSize: 20, textAlign: "center" }]}>{result.title}</Text>
            {!!result.subtitle && <Text style={[styles.muted, { textAlign: "center" }]}>{result.subtitle}</Text>}
          </>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}

      {phase === "ready" && <Button label="Escanear pulseira" onPress={start} />}
      {phase === "scanning" && <Button label="Cancelar" kind="secondary" onPress={cancel} />}
      {phase === "result" && (
        <>
          <Button label="Escanear outra pulseira" onPress={start} />
          {!!result?.url && <Button label="Compartilhar o link" kind="secondary" onPress={() => Share.share({ message: result.url as string }).catch(() => undefined)} />}
          <Button label="Imprimir os QR Codes (abre o site)" kind="secondary" onPress={() => Linking.openURL(`${LINKS.site}admin/pulseiras/`).catch(() => undefined)} />
        </>
      )}

      <Text style={[styles.strong, { marginTop: 14, marginBottom: 6 }]}>Pulseiras liberadas {list ? `(${list.active} ativas)` : ""}</Text>
      {list && !list.bracelets.length && <Text style={styles.muted}>Nenhuma pulseira liberada ainda.</Text>}
      {list?.bracelets.map((b) => (
        <View key={b.id} style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.strong}>{b.label}{b.status === "revoked" ? " · desativada" : ""}</Text>
            <Text style={styles.muted}>Liberada em {fmtDate(b.created_at)} · {b.uses} acesso(s){b.last_used_at ? ` · último em ${fmtDate(b.last_used_at)}` : ""}</Text>
          </View>
          {b.status === "active" && <Text onPress={() => revoke(b)} style={{ color: colors.red, fontWeight: "800", padding: 8 }}>Desativar</Text>}
        </View>
      ))}
    </ScrollView>
  );
}
