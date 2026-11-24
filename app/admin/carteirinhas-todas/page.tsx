import type { Metadata } from "next";
import AllCardsView from "./AllCardsView";

export const metadata: Metadata = {
  title: "Todas as carteirinhas | Projeto Mão Com Mão",
  robots: { index: false, follow: false },
};

export default function AllCardsPage() {
  return <AllCardsView />;
}
