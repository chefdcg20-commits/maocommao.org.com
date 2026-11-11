import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { detectRole, errorText, hasSession, logout, Role } from "./src/api";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import Shell from "./src/screens/Shell";
import { colors } from "./src/theme";
import { Button } from "./src/ui";

type State = "loading" | "login" | "register" | "ready" | "norole" | "offline";

export default function App() {
  const [state, setState] = useState<State>("loading");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");

  // Depois do login, descobre se a conta e da equipe ou da familia.
  const enter = useCallback(async () => {
    setState("loading");
    try {
      const found = await detectRole();
      if (!found) return setState("norole");
      setRole(found);
      setState("ready");
    } catch (e) {
      const text = errorText(e);
      if (text.startsWith("Sessão expirada")) return setState("login");
      setError(text);
      setState("offline");
    }
  }, []);

  useEffect(() => {
    hasSession().then((ok) => (ok ? enter() : setState("login")));
  }, [enter]);

  const signOut = useCallback(async () => {
    await logout();
    setRole(null);
    setState("login");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {state === "loading" && <ActivityIndicator color={colors.amber} style={{ flex: 1 }} />}
      {state === "login" && <LoginScreen onDone={enter} onRegister={() => setState("register")} />}
      {state === "register" && <RegisterScreen onDone={enter} onBack={() => setState("login")} />}
      {state === "ready" && role && <Shell role={role} onLogout={signOut} />}
      {(state === "norole" || state === "offline") && (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
          <Text style={{ color: colors.text, textAlign: "center", fontSize: 18 }}>
            {state === "norole" ? "Esta conta não tem acesso ao aplicativo. Fale com os mestres." : error}
          </Text>
          {state === "offline" && <Button label="Tentar de novo" onPress={enter} />}
          <Button label="Sair" kind="secondary" onPress={signOut} />
        </View>
      )}
    </View>
  );
}
