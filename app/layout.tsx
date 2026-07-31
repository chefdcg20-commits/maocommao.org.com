import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://maocommao-org-com.vercel.app'),
  title: 'Projeto Social Mão com Mão | Jiu-jítsu e transformação social',
  description:
    'Projeto social de Diadema que utiliza o jiu-jítsu como instrumento de disciplina, acolhimento e transformação social.',
  keywords: ['Projeto Social', 'Jiu-jítsu', 'Diadema', 'Doação', 'Patrocínio', 'Ação social'],
  openGraph: {
    title: 'Projeto Social Mão com Mão',
    description: 'Transformando vidas através do jiu-jítsu, da disciplina e da solidariedade.',
    type: 'website',
    locale: 'pt_BR'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
