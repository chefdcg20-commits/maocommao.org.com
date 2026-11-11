import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

let started = false;

export async function nfcStatus(): Promise<"ok" | "unsupported" | "disabled"> {
  if (!(await NfcManager.isSupported())) return "unsupported";
  if (!started) { await NfcManager.start(); started = true; }
  return (await NfcManager.isEnabled()) ? "ok" : "disabled";
}

export const openNfcSettings = () => NfcManager.goToNfcSetting();

// Espera o cartao encostar e devolve o identificador do chip (hexadecimal).
export async function readUid(): Promise<string> {
  try {
    await NfcManager.requestTechnology(NfcTech.NfcA);
    const tag = await NfcManager.getTag();
    if (!tag?.id) throw new Error("no_id");
    return tag.id;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

const hex = (value: string) => value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();

// Grava um endereco (URL) no chip. So grava se for o MESMO chip que acabou de ser lido (confere o identificador).
// O identificador do chip nao muda, entao a chamada por chip continua funcionando.
export async function writeUrl(url: string, expectedUid: string): Promise<void> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    if (!tag?.id || hex(tag.id) !== hex(expectedUid)) throw new Error("other_tag");
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    if (!bytes) throw new Error("encode");
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

export const cancelRead = () => NfcManager.cancelTechnologyRequest().catch(() => undefined);
