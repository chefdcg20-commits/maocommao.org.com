import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api, errorText } from "../api";
import { colors } from "../theme";
import { Button, styles } from "../ui";

type Detail = { id: string; student_full_name: string; birth_date: string; photo_url: string | null; guardian_full_name: string; guardian_phone: string; guardian_email: string | null };

const toBr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const toIso = (br: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

// Editar cadastro do aluno (so mestres): nome, data de nascimento, foto e dados do responsavel.
// Tambem permite retirar da lista um cadastro duplicado.
export default function EditStudentModal({ id, onClose }: { id: string; onClose: (changed: boolean) => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [guardian, setGuardian] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<{ uri: string; dataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ student: Detail }>({ action: "get", id }, "admin")
      .then(({ student }) => {
        setDetail(student);
        setName(student.student_full_name);
        setBirth(toBr(student.birth_date));
        setGuardian(student.guardian_full_name);
        setPhone(student.guardian_phone);
        setEmail(student.guardian_email || "");
      })
      .catch((e) => setError(errorText(e)));
  }, [id]);

  async function choosePhoto(camera: boolean) {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permissão necessária", camera ? "Permita o uso da câmera para tirar a foto." : "Permita o acesso às fotos para escolher uma imagem.");
    const options = { mediaTypes: ["images"] as ImagePicker.MediaType[], allowsEditing: true, aspect: [3, 4] as [number, number], quality: 0.6, base64: true };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (asset?.base64) setPhoto({ uri: asset.uri, dataUrl: `data:image/jpeg;base64,${asset.base64}` });
  }

  async function save() {
    const iso = toIso(birth);
    if (name.trim().length < 3) return setError("Escreva o nome completo do aluno.");
    if (!iso) return setError("Data de nascimento no formato DD/MM/AAAA.");
    if (!guardian.trim() || !phone.trim()) return setError("O nome e o telefone do responsável são obrigatórios.");
    setBusy(true);
    setError("");
    try {
      await api({ action: "update_student", id, student_full_name: name, birth_date: iso, guardian_full_name: guardian, guardian_phone: phone, guardian_email: email }, "admin");
      if (photo) await api({ action: "replace_photo", id, data_url: photo.dataUrl }, "admin");
      onClose(true);
    } catch (e) {
      const text = errorText(e);
      setError(text.includes("duplicate") || text.includes("duplic") ? "Já existe outro aluno com este nome e esta data de nascimento." : text);
    } finally {
      setBusy(false);
    }
  }

  function removeDuplicate() {
    Alert.alert("Retirar este cadastro da lista?", `${name}\nUse só se este aluno estiver cadastrado em duplicidade. O cadastro sai da chamada e fica guardado como recusado (não é apagado).`, [
      { text: "Não", style: "cancel" },
      {
        text: "Retirar da lista",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await api({ action: "mark_duplicate", id }, "admin");
            onClose(true);
          } catch (e) {
            setError(errorText(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  const shownPhoto = photo?.uri || detail?.photo_url;

  return (
    <Modal visible animationType="slide" onRequestClose={() => onClose(false)}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 52, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.strong, { fontSize: 22, color: colors.amber, marginBottom: 12 }]}>Editar cadastro</Text>
          {!detail && !error && <ActivityIndicator color={colors.amber} style={{ marginTop: 30 }} />}
          {detail && (
            <>
              <View style={{ alignItems: "center", marginBottom: 12 }}>
                {shownPhoto ? <Image source={{ uri: shownPhoto }} style={{ width: 120, height: 160, borderRadius: 12 }} /> : <View style={{ width: 120, height: 160, borderRadius: 12, backgroundColor: colors.border }} />}
                <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                  <Text onPress={() => choosePhoto(true)} style={{ color: colors.amber, fontWeight: "800", padding: 8 }}>📷 Tirar foto</Text>
                  <Text onPress={() => choosePhoto(false)} style={{ color: colors.amber, fontWeight: "800", padding: 8 }}>🖼️ Escolher da galeria</Text>
                </View>
                {!!photo && <Text style={styles.muted}>Nova foto escolhida: toque em Salvar para trocar.</Text>}
              </View>
              <Text style={styles.muted}>Nome do aluno</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={120} autoCapitalize="words" />
              <Text style={styles.muted}>Data de nascimento (DD/MM/AAAA)</Text>
              <TextInput style={styles.input} value={birth} onChangeText={setBirth} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} />
              <Text style={styles.muted}>Responsável</Text>
              <TextInput style={styles.input} value={guardian} onChangeText={setGuardian} maxLength={120} autoCapitalize="words" />
              <Text style={styles.muted}>Telefone / WhatsApp do responsável</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={30} />
              <Text style={styles.muted}>E-mail do responsável (opcional)</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={160} />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Button label="Salvar" onPress={save} busy={busy} />
              <Button label="Cancelar" kind="secondary" onPress={() => onClose(false)} />
              <Text onPress={removeDuplicate} style={{ color: colors.red, textAlign: "center", marginTop: 22, padding: 10 }}>Este aluno está duplicado: retirar da lista</Text>
            </>
          )}
          {!detail && !!error && (
            <>
              <Text style={styles.error}>{error}</Text>
              <Button label="Fechar" kind="secondary" onPress={() => onClose(false)} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
