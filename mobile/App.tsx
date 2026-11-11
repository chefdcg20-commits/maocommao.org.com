import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { hasSession, logout } from "./src/api";
import LoginScreen from "./src/screens/LoginScreen";
import RosterScreen from "./src/screens/RosterScreen";
import { colors } from "./src/theme";

export default function App() {
  const [state, setState] = useState<"loading" | "login" | "roster">("loading");

  useEffect(() => {
    hasSession().then((ok) => setState(ok ? "roster" : "login"));
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setState("login");
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {state === "loading" && <ActivityIndicator color={colors.amber} style={{ flex: 1 }} />}
      {state === "login" && <LoginScreen onDone={() => setState("roster")} />}
      {state === "roster" && <RosterScreen onLogout={signOut} />}
    </View>
  );
}
