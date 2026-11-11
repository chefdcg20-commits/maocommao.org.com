import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { errorText, login } from "../api";
import { colors } from "../theme";

export default function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!email || !password) return setError("Digite e-mail e senha.");
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
      <Image source={require("../../assets/icon.png")} style={styles.logo} />
      <Text style={styles.title}>Mão Com Mão</Text>
      <Text style={styles.sub}>Acesso da equipe</Text>
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.muted} secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={[styles.button, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#020617" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: 24 },
  logo: { width: 110, height: 110, borderRadius: 55, alignSelf: "center", marginBottom: 16 },
  title: { color: colors.amber, fontSize: 28, fontWeight: "900", textAlign: "center" },
  sub: { color: colors.muted, textAlign: "center", marginBottom: 24 },
  input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, color: colors.text, padding: 14, fontSize: 16, marginBottom: 12 },
  error: { color: colors.red, marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: colors.amber, borderRadius: 14, padding: 16, alignItems: "center" },
  buttonText: { color: "#020617", fontWeight: "900", fontSize: 16 },
});
