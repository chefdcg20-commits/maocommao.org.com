import type { Metadata } from "next";
import CardView from "./CardView";

export const metadata: Metadata = {
  title: "Carteirinha | Projeto Mão Com Mão",
  robots: { index: false, follow: false },
};

export default function CarteirinhaAdminPage() {
  return <CardView />;
}
