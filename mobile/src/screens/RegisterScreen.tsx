import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from "react-native";
import { errorText, registerFamily } from "../api";
import { colors } from "../theme";
import { Button, styles } from "../ui";

// Cadastro de pais/responsaveis e alunos adultos. Exige o codigo divulgado no grupo.
export default function RegisterScreen({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!code.trim() || name.trim().length < 3 || !email.trim() || !password) return setError("Preencha todos os campos.");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    setBusy(true);
    setError("");
    try {
      await registerFamily({ code, name, email, password });
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
        <Image source={require("../../assets/icon.png")} style={{ width: 90, height: 90, borderRadius: 45, alignSelf: "center", marginBottom: 12 }} />
        <Text style={{ color: colors.amber, fontSize: 26, fontWeight: "900", textAlign: "center" }}>Criar conta</Text>
        <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 20 }}>Pais, responsáveis e alunos adultos</Text>
        <TextInput style={styles.input} placeholder="Código do grupo" placeholderTextColor={colors.muted} autoCapitalize="characters" value={code} onChangeText={setCode} />
        <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Senha (mínimo 8 caracteres)" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button label="Criar conta" onPress={submit} busy={busy} />
        <Pressable onPress={onBack}><Text style={{ color: colors.muted, textAlign: "center", padding: 12 }}>Já tenho conta · Entrar</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
