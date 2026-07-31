import Image from 'next/image';
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiFileText,
  FiGift,
  FiHeart,
  FiHome,
  FiMapPin,
  FiShield,
  FiTarget,
  FiUsers
} from 'react-icons/fi';
import { Header } from '@/components/Header';
import { ContactForm } from '@/components/ContactForm';

const team = [
  ['Joaquim Guedes', 'Presidente e mestre'],
  ['Daniel Guedes', 'Secretário e professor'],
  ['Thamires Guedes', 'Tesoureira'],
  ['Marconi Zovico', 'Professor'],
  ['Luizão', 'Professor'],
  ['Marcos', 'Professor']
];

const galleryImages = [
  { file: 'gallery-1.jpg', alt: 'Registro das atividades do projeto 1', fit: 'cover' },
  { file: 'gallery-2.jpg', alt: 'Registro das atividades do projeto 2', fit: 'cover' },
  { file: 'gallery-3.jpg', alt: 'Professores e alunos do Projeto Mão com Mão reunidos no tatame', fit: 'contain' },
  { file: 'gallery-4.jpg', alt: 'Alunos do Projeto Mão com Mão participando de uma atividade coletiva no tatame', fit: 'cover' },
  { file: 'gallery-5.jpg', alt: 'Turma do Projeto Mão com Mão reunida com a bandeira do projeto', fit: 'cover' },
  { file: 'gallery-6.jpg', alt: 'Professor registrando uma confraternização com alunos e familiares no tatame', fit: 'contain' },
  { file: 'gallery-7.jpg', alt: 'Professores do Projeto Mão com Mão ao lado de uma aluna', fit: 'contain' }
];

export default function Home() {
  return (
    <main>
      <Header />

      <section id="inicio" className="relative min-h-[690px] overflow-hidden bg-brand-900 text-white">
        <Image
          src="/images/professores-hero.jpg"
          alt="Professores do Projeto Mão com Mão no tatame"
          fill
          priority
          className="object-cover object-[55%_0%] md:object-[center_5%]"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="container-site relative flex min-h-[690px] items-center py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
              <FiMapPin aria-hidden /> Diadema, São Paulo
            </span>
            <h1 className="mt-7 text-[2rem] font-black uppercase leading-[1.02] sm:text-5xl lg:text-7xl">
              Transformando vidas através do <span className="text-gold">jiu-jítsu</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-100 sm:text-xl">
              Disciplina, respeito, acolhimento e oportunidades dentro e fora do tatame. Um projeto construído com a comunidade e para a comunidade.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#doacao" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-7 py-4 font-black text-brand-900 transition hover:-translate-y-1 hover:shadow-xl">
                <FiHeart aria-hidden /> Faça uma doação
              </a>
              <a href="#patrocinio" className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white hover:text-brand-900">
                Seja um patrocinador <FiChevronRight aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-800 py-6 text-white">
        <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [FiUsers, '59 alunos', 'Cadastros organizados do projeto'],
            [FiAward, 'Turmas sociais', 'Infantil e adulto'],
            [FiMapPin, 'Diadema - SP', 'Atuação comunitária local'],
            [FiGift, 'Apoio às famílias', 'Alimentos e ações solidárias']
          ].map(([Icon, title, text]) => {
            const Component = Icon as typeof FiUsers;
            return (
              <div key={String(title)} className="flex items-center gap-4">
                <Component className="shrink-0 text-3xl text-gold" aria-hidden />
                <div><strong className="block text-lg">{String(title)}</strong><span className="text-sm text-blue-100">{String(text)}</span></div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="quem-somos" className="section-space">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-brand-600">Quem somos</p>
            <h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Mais que um projeto esportivo: uma rede de transformação.</h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              O Projeto Social Mão com Mão oferece aulas sociais de jiu-jítsu para crianças, adolescentes e adultos, fortalecendo valores que acompanham os alunos para toda a vida.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              O trabalho também alcança famílias em situação de vulnerabilidade por meio de arrecadações, apoio alimentar, mobilização comunitária e parcerias responsáveis.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                [FiTarget, 'Missão', 'Transformar por meio do esporte e da solidariedade.'],
                [FiBookOpen, 'Visão', 'Ampliar o atendimento e conquistar um espaço próprio.'],
                [FiShield, 'Valores', 'Respeito, disciplina, transparência e acolhimento.']
              ].map(([Icon, title, text]) => {
                const Component = Icon as typeof FiTarget;
                return <div key={String(title)} className="rounded-2xl bg-brand-50 p-5"><Component className="text-2xl text-brand-700" /><h3 className="mt-3 font-black text-brand-900">{String(title)}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{String(text)}</p></div>;
              })}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl shadow-soft">
            <Image src="/images/gallery-1.jpg" alt="Alunos do projeto reunidos" width={900} height={650} className="h-full min-h-[430px] w-full object-cover" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-5 backdrop-blur">
              <strong className="text-xl text-brand-900">Construindo um futuro melhor, mão com mão.</strong>
              <p className="mt-1 text-sm text-slate-600">Cada aluno, família, voluntário e parceiro faz parte dessa história.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="impacto" className="section-space bg-slate-50">
        <div className="container-site text-center">
          <p className="font-black uppercase tracking-[0.2em] text-brand-600">Impacto social</p>
          <h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Resultados que representam pessoas.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-slate-600">Os números abaixo utilizam os registros atualmente disponíveis e poderão ser atualizados conforme a documentação oficial avançar.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['59', 'alunos cadastrados'],
              ['40', 'famílias já alcançadas em ações'],
              ['50', 'tatames como meta estrutural'],
              ['40', 'kimonos como meta de atendimento']
            ].map(([number, label]) => (
              <div key={label} className="rounded-3xl bg-white p-8 shadow-sm"><strong className="block text-5xl font-black text-brand-700">{number}</strong><span className="mt-3 block font-bold text-slate-700">{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section id="aulas" className="section-space">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-brand-600">Aulas e horários</p>
            <h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Jiu-jítsu com orientação, disciplina e acolhimento.</h2>
            <p className="mt-5 leading-relaxed text-slate-600">As atividades são realizadas em Diadema e organizadas por faixa etária e nível de desenvolvimento dos alunos.</p>
            <div className="mt-7 flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5"><FiMapPin className="mt-1 shrink-0 text-2xl text-brand-700" /><p><strong className="block text-brand-900">Ginásio Municipal Casa Grande</strong><span className="text-sm text-slate-600">Diadema, São Paulo. Confirme o endereço e a disponibilidade antes de comparecer.</span></p></div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
            {[
              ['Infantil — turma 1', 'Quintas-feiras, 18h'],
              ['Infantil — turma 2', 'Quintas-feiras, 19h'],
              ['Adulto', 'Quintas-feiras, 20h']
            ].map(([title, time]) => (
              <div key={title} className="flex items-center justify-between gap-5 border-b border-slate-200 p-6 last:border-0"><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><FiCalendar /></span><div><h3 className="font-black text-brand-900">{title}</h3><p className="text-sm text-slate-500">Aula social de jiu-jítsu</p></div></div><strong className="text-right text-brand-700">{time}</strong></div>
            ))}
          </div>
        </div>
      </section>

      <section id="acoes" className="section-space bg-brand-900 text-white">
        <div className="container-site">
          <div className="max-w-3xl"><p className="font-black uppercase tracking-[0.2em] text-gold">Ações sociais</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">O cuidado vai além do tatame.</h2><p className="mt-5 text-lg leading-relaxed text-blue-100">O projeto mobiliza doações e parceiros para apoiar alunos e famílias, fortalecendo segurança alimentar, dignidade e cidadania.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [FiGift, 'Arrecadação de alimentos', 'Campanhas e apoio a famílias em situação de vulnerabilidade.'],
              [FiAward, 'Tatames e kimonos', 'Materiais esportivos que ampliam a segurança e a participação nas aulas.'],
              [FiUsers, 'Rede de parceiros', 'Empresas, poder público, voluntários e comunidade unidos pelo mesmo propósito.']
            ].map(([Icon, title, text]) => {
              const Component = Icon as typeof FiGift;
              return <div key={String(title)} className="rounded-3xl border border-white/15 bg-white/10 p-7"><Component className="text-3xl text-gold" /><h3 className="mt-5 text-xl font-black">{String(title)}</h3><p className="mt-3 leading-relaxed text-blue-100">{String(text)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section id="equipe" className="section-space">
        <div className="container-site">
          <div className="text-center"><p className="font-black uppercase tracking-[0.2em] text-brand-600">Equipe e diretoria</p><h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Pessoas que servem com propósito.</h2></div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map(([name, role]) => <article key={name} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-800 text-lg font-black text-white">{name.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><div><h3 className="font-black text-brand-900">{name}</h3><p className="text-sm text-slate-500">{role}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="section-space bg-slate-50" id="galeria">
        <div className="container-site">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-black uppercase tracking-[0.2em] text-brand-600">Galeria</p><h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Momentos que contam nossa história.</h2></div><p className="max-w-md text-slate-600">Registros das aulas, encontros e conquistas vividas pela comunidade do Projeto Mão com Mão.</p></div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {galleryImages.map(({ file, alt, fit }) => <div key={file} className="overflow-hidden rounded-3xl"><Image src={`/images/${file}`} alt={alt} width={700} height={520} className={`h-72 w-full transition duration-500 hover:scale-105 ${fit === 'contain' ? 'bg-slate-100 object-contain' : 'object-cover'}`} /></div>)}
          </div>
        </div>
      </section>

      <section id="patrocinio" className="section-space">
        <div className="container-site grid overflow-hidden rounded-[2rem] bg-brand-800 text-white lg:grid-cols-2">
          <div className="p-8 sm:p-12"><p className="font-black uppercase tracking-[0.2em] text-gold">Seja um patrocinador</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Sua empresa pode deixar um legado em Diadema.</h2><p className="mt-5 leading-relaxed text-blue-100">O apoio pode financiar materiais, competições, alimentação, comunicação e a futura manutenção de um espaço próprio.</p><ul className="mt-7 grid gap-3 text-sm">{['Exposição responsável da marca', 'Relatórios e prestação de contas', 'Participação em ações e eventos', 'Impacto social mensurável'].map((item) => <li key={item} className="flex items-center gap-3"><FiCheck className="text-gold" /> {item}</li>)}</ul><a href="#contato" className="focus-ring mt-8 inline-flex rounded-xl bg-gold px-6 py-4 font-black text-brand-900">Quero conversar sobre patrocínio</a></div>
          <div className="relative min-h-96"><Image src="/images/gallery-2.jpg" alt="Turma do projeto social" fill className="object-cover" /></div>
        </div>
      </section>

      <section id="doacao" className="section-space bg-slate-950 text-white">
        <div className="container-site text-center"><FiHeart className="mx-auto text-4xl text-gold" /><p className="mt-4 font-black uppercase tracking-[0.2em] text-gold">Faça uma doação</p><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black sm:text-5xl">Toda contribuição ajuda o projeto a permanecer em movimento.</h2><p className="mx-auto mt-5 max-w-2xl text-slate-300">Você pode ajudar financeiramente ou doar alimentos, kimonos, tatames e outros materiais. As formas oficiais de doação serão inseridas após validação da diretoria.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="#contato" className="focus-ring rounded-xl bg-gold px-7 py-4 font-black text-brand-900">Quero doar</a><a href="#contato" className="focus-ring rounded-xl border border-white/30 px-7 py-4 font-black text-white">Quero doar materiais</a></div></div>
      </section>

      <section id="transparencia" className="section-space">
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <div><p className="font-black uppercase tracking-[0.2em] text-brand-600">Transparência</p><h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Confiança se constrói com responsabilidade.</h2><p className="mt-5 leading-relaxed text-slate-600">Esta área foi preparada para disponibilizar estatuto, atas, relatórios, prestações de contas, recibos e demais documentos públicos do projeto.</p></div>
          <div className="grid gap-3">{['Estatuto social', 'Atas e registros', 'Relatórios de atividades', 'Prestação de contas e documentos'].map((item) => <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-200 p-5"><span className="flex items-center gap-3 font-bold text-brand-900"><FiFileText className="text-brand-600" /> {item}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Em preparação</span></div>)}</div>
        </div>
      </section>

      <section id="contato" className="section-space bg-brand-50">
        <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="font-black uppercase tracking-[0.2em] text-brand-600">Contato</p><h2 className="mt-3 text-3xl font-black text-brand-900 sm:text-5xl">Vamos construir essa transformação juntos.</h2><p className="mt-5 leading-relaxed text-slate-600">Entre em contato para conhecer as aulas, apoiar uma ação, oferecer uma parceria ou participar do projeto.</p><div className="mt-7 grid gap-4"><div className="flex gap-3"><FiMapPin className="mt-1 text-brand-700" /><p><strong className="block text-brand-900">Diadema, São Paulo</strong><span className="text-sm text-slate-600">Atuação principal no bairro Casa Grande.</span></p></div><div className="flex gap-3"><FiHome className="mt-1 text-brand-700" /><p><strong className="block text-brand-900">Espaço próprio</strong><span className="text-sm text-slate-600">Uma das metas prioritárias para a próxima fase.</span></p></div></div></div>
          <ContactForm />
        </div>
      </section>

      <footer className="bg-slate-950 py-10 text-slate-300">
        <div className="container-site flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><strong className="text-lg text-white">Projeto Social Mão com Mão</strong><p className="mt-1 text-sm">Jiu-jítsu, solidariedade e transformação social em Diadema.</p></div><p className="text-sm">© 2026 Projeto Social Mão com Mão. Conteúdo institucional sujeito à validação da diretoria.</p></div>
      </footer>
    </main>
  );
}
