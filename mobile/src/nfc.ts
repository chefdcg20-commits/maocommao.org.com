import NfcManager, { NfcTech } from "react-native-nfc-manager";

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

export const cancelRead = () => NfcManager.cancelTechnologyRequest().catch(() => undefined);
