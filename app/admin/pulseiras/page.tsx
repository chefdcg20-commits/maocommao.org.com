import type { Metadata } from "next";
import PulseirasView from "./PulseirasView";

export const metadata: Metadata = {
  title: "Pulseiras | Mão Com Mão",
  robots: { index: false, follow: false },
};

export default function PulseirasPage() {
  return <PulseirasView />;
}
