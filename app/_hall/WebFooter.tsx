const ITEMS: [string, string, string][] = [
  ["🌐", "Site", "/"],
  ["📸", "Instagram", "https://www.instagram.com/mao.com.mao?igsh=YW1wcGcyd2w2MzR2"],
  ["👍", "Facebook", "https://www.facebook.com/share/1Pf1rx1mYQ/"],
  ["💬", "Grupo", "https://chat.whatsapp.com/HKVWuTNfP1XImKgvemIzGs?s=cl&p=a&ilr=1&amv=0"],
  ["📍", "Mapa", "https://maps.app.goo.gl/UwXmbHq4v2GXDK336?g_st=ac"],
];

// Rodape fixo das paginas de equipe e familia: site e redes sempre a um toque.
export function WebFooter() {
  return (
    <nav aria-label="Site e redes do projeto" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-800 bg-slate-900 pb-3 pt-1.5">
      {ITEMS.map(([icon, label, url]) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col items-center py-1 text-slate-400">
          <span className="text-lg">{icon}</span>
          <span className="text-[11px] font-bold">{label}</span>
        </a>
      ))}
    </nav>
  );
}
