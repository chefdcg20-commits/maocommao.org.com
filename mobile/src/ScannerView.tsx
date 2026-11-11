import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

export type ScanState = "idle" | "ok" | "warn" | "error";

const WORD = "OSS!";
const HEIGHT = 120;
const WIDTH = 300;
const FONT = { fontSize: 92, lineHeight: 112, fontWeight: "900" as const, letterSpacing: 4, includeFontPadding: false };
// Contorno desenhado com varias copias deslocadas; o miolo fica da cor do fundo (letras "transparentes") ou verde no sucesso.
const OFFSETS: [number, number][] = [[-3, 0], [3, 0], [0, -3], [0, 3], [-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]];

const TONE: Record<ScanState, { edge: string; fill: string }> = {
  idle: { edge: "#ffffff", fill: colors.card },
  ok: { edge: colors.green, fill: colors.green },
  warn: { edge: colors.amber, fill: colors.amber },
  error: { edge: colors.red, fill: colors.red },
};

// Leitor padrao do app: a palavra OSS! em contorno branco com uma linha de varredura que sobe e desce.
// Ao concluir a leitura a palavra fica verde (ou amarela/vermelha em aviso/erro).
export default function ScannerView({ state }: { state: ScanState }) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== "idle") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, sweep]);

  const tone = TONE[state];
  const lineColor = state === "idle" ? colors.green : tone.edge;
  const translateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, HEIGHT - 4] });

  return (
    <View style={styles.box} accessibilityLabel={state === "ok" ? "Leitura concluída" : "Aguardando leitura"}>
      <View style={styles.word}>
        <Text style={[FONT, { opacity: 0 }]}>{WORD}</Text>
        {OFFSETS.map(([dx, dy]) => (
          <Text key={`${dx},${dy}`} style={[FONT, styles.layer, { left: dx, top: dy, color: tone.edge }]}>{WORD}</Text>
        ))}
        <Text style={[FONT, styles.layer, { left: 0, top: 0, color: tone.fill }]}>{WORD}</Text>
      </View>
      {state === "idle" && (
        <Animated.View style={[styles.line, { backgroundColor: lineColor, shadowColor: lineColor, transform: [{ translateY }] }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: WIDTH, height: HEIGHT, alignSelf: "center", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  word: { alignItems: "center", justifyContent: "center" },
  layer: { position: "absolute" },
  line: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: 2, shadowOpacity: 0.95, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
});
