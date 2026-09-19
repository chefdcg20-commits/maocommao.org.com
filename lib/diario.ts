export type DiarioPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  publishedLabel: string;
  eventDate: string;
  eventDateLabel: string;
  image: string;
  imageAlt: string;
  imageOrientation?: 'portrait' | 'landscape' | 'wide' | 'fourThree';
  storyImage?: string;
  storyImageAlt?: string;
  storyImageCaption?: string;
  seoTitle?: string;
  keywords?: string[];
  youtubeId?: string;
  youtubeUrl?: string;
  videoPublishedAt?: string;
  paragraphs: string[];
};

export const diarioPosts: DiarioPost[] = [
  {
    slug: 'campanha-arrecadacao-alimentos-outubro-2026',
    title: 'Campanha de arrecadação de alimentos: doe até 29 de outubro',
    seoTitle: 'Arrecadação de alimentos em Diadema | Mão Com Mão',
    excerpt:
      'O Projeto Mão Com Mão está arrecadando alimentos não perecíveis para ajudar famílias. A campanha será encerrada na quinta-feira, 29 de outubro de 2026.',
    keywords: [
      'arrecadação de alimentos em Diadema',
      'doação de alimentos',
      'campanha solidária',
      'Projeto Mão Com Mão',
      'ajudar famílias em Diadema'
    ],
    category: 'Campanha',
    publishedAt: '2026-09-19',
    publishedLabel: '19 de setembro de 2026',
    eventDate: '2026-10-29',
    eventDateLabel: 'Encerramento: quinta-feira, 29 de outubro de 2026',
    image: '/images/diario-campanha-arrecadacao-alimentos-2026.jpg',
    imageAlt: 'Arte da campanha de arrecadação de alimentos do Projeto Mão Com Mão',
    imageOrientation: 'portrait',
    paragraphs: [
      'O Projeto Mão Com Mão iniciou uma campanha de arrecadação de alimentos não perecíveis para apoiar famílias que precisam de ajuda em nossa comunidade.',
      'Podem ser doados itens como arroz, feijão, macarrão, leite longa vida, óleo, enlatados e outros alimentos dentro do prazo de validade. Cada contribuição, independentemente da quantidade, fará diferença na mesa de uma família.',
      'A campanha seguirá até a última quinta-feira de outubro e será encerrada no dia 29 de outubro de 2026. Até essa data, queremos mobilizar alunos, familiares, professores, parceiros e toda a comunidade de Diadema.',
      'Para combinar a entrega dos alimentos, entre em contato com Daniel pelo WhatsApp disponível nesta página. Juntos podemos ajudar mais famílias e mostrar que solidariedade também faz parte do nosso maior combate.'
    ]
  },
  {
    slug: 'treino-com-bola-aprendendo-triangulo-jiu-jitsu',
    title: 'Treino com bola: aprendendo triângulo no jiu-jítsu',
    seoTitle: 'Treino de triângulo no jiu-jítsu infantil | Mão Com Mão',
    excerpt:
      'No vídeo mais recente do Projeto Mão Com Mão, a turma aprende o triângulo no jiu-jítsu com uma atividade dinâmica, divertida e adaptada para os alunos.',
    keywords: [
      'triângulo no jiu-jítsu',
      'jiu-jítsu infantil em Diadema',
      'treino de jiu-jítsu com bola',
      'Projeto Mão Com Mão',
      'aulas gratuitas de jiu-jítsu'
    ],
    category: 'Vídeo',
    publishedAt: '2026-09-19',
    publishedLabel: '19 de setembro de 2026',
    eventDate: '2026-09-18',
    eventDateLabel: 'Sexta-feira, 18 de setembro de 2026',
    image: '/images/diario-video-treino-bola-triangulo.jpg',
    imageAlt: 'Capa do vídeo Treino com bola, aprendendo triângulo no jiu-jítsu, do Projeto Mão Com Mão',
    imageOrientation: 'wide',
    youtubeId: 'D7qBQ7oqMCc',
    youtubeUrl: 'https://youtu.be/D7qBQ7oqMCc',
    videoPublishedAt: '2026-09-18T16:16:40-03:00',
    paragraphs: [
      'O vídeo mais recente do canal Mão Com Mão mostra uma aula diferente e divertida: o uso da bola como apoio para ensinar o triângulo, uma técnica importante do jiu-jítsu.',
      'Atividades dinâmicas ajudam os alunos a compreender movimentos, posicionamento e coordenação de maneira mais leve, mantendo a atenção da turma e tornando o aprendizado mais envolvente.',
      'O Projeto Mão Com Mão oferece aulas gratuitas de jiu-jítsu para crianças e jovens em Diadema, promovendo disciplina, respeito, inclusão e desenvolvimento por meio do esporte.',
      'Assista ao vídeo, inscreva-se no canal e compartilhe com outras famílias. Cada visualização ajuda nosso projeto a alcançar mais pessoas. Oss!'
    ]
  },
  {
    slug: 'chuva-infiltracao-treino-cancelado-novo-espaco',
    title: 'A chuva interrompe o treino e reforça a busca por um novo espaço',
    seoTitle: 'Chuva cancela treino de jiu-jítsu infantil em Diadema',
    excerpt:
      'A infiltração na sala voltou a impedir o treino do Projeto Mão Com Mão. O episódio reforça a necessidade de um espaço novo, seguro e adequado para as turmas.',
    keywords: [
      'treino de jiu-jítsu cancelado pela chuva',
      'infiltração em projeto social',
      'jiu-jítsu infantil em Diadema',
      'Projeto Mão Com Mão',
      'novo espaço para projeto social'
    ],
    category: 'Vídeo',
    publishedAt: '2026-09-12',
    publishedLabel: '12 de setembro de 2026',
    eventDate: '2026-09-11',
    eventDateLabel: 'Sexta-feira, 11 de setembro de 2026',
    image: '/images/diario-video-treino-cancelado-chuva.jpg',
    imageAlt: 'Capa do vídeo Treino cancelado por causa da chuva, do Projeto Mão Com Mão',
    imageOrientation: 'wide',
    storyImage: '/images/diario-infiltracao-busca-novo-espaco.jpg',
    storyImageAlt: 'Alunos e professores do Projeto Mão Com Mão reunidos no espaço atual de treinamento',
    storyImageCaption: 'Uma das turmas do Projeto Mão Com Mão reunida no espaço atual de treinamento.',
    youtubeId: 'mLha5vpyDpw',
    youtubeUrl: 'https://youtu.be/mLha5vpyDpw',
    videoPublishedAt: '2026-09-11T07:00:19-03:00',
    paragraphs: [
      'Quando chove, o Projeto Mão Com Mão enfrenta um problema recorrente: a sala apresenta infiltrações. Desta vez, a situação impediu a realização do treino e a atividade precisou ser cancelada.',
      'A segurança e o bem-estar dos alunos são prioridades. Com a entrada de água, fica difícil manter o tatame e o ambiente nas condições adequadas para receber crianças, jovens, professores e famílias.',
      'Ao mesmo tempo, nossas turmas continuam crescendo. A foto mostra uma das turmas atendidas pelo projeto e ajuda a dimensionar o quanto precisamos de uma estrutura maior, protegida da chuva e preparada para acolher todos com segurança.',
      'Por isso, seguimos em busca de um novo espaço em Diadema: coberto, seguro e adequado para dar continuidade às aulas gratuitas de jiu-jítsu e ampliar o impacto social do Projeto Mão Com Mão.',
      'Assista ao vídeo e compartilhe esta história. O apoio da comunidade, de empresas e de parceiros pode nos ajudar a encontrar um novo local e evitar que a chuva interrompa novamente o desenvolvimento dos nossos atletas. Oss!'
    ]
  },
  {
    slug: 'treino-infantil-jiu-jitsu-gratuito-diadema',
    title: 'Treino infantil de jiu-jítsu gratuito em Diadema',
    seoTitle: 'Jiu-jítsu infantil gratuito em Diadema | Mão Com Mão',
    excerpt:
      'Conheça o treino infantil de jiu-jítsu gratuito do Projeto Mão Com Mão em Diadema (SP), com aulas para crianças que promovem disciplina, respeito e inclusão.',
    keywords: [
      'jiu-jítsu infantil gratuito em Diadema',
      'aulas de jiu-jítsu para crianças',
      'Projeto Mão Com Mão',
      'esporte social em Diadema',
      'treino infantil de jiu-jítsu'
    ],
    category: 'Vídeo',
    publishedAt: '2026-09-05',
    publishedLabel: '5 de setembro de 2026',
    eventDate: '2026-09-04',
    eventDateLabel: 'Sexta-feira, 4 de setembro de 2026',
    image: '/images/diario-segundo-video-jiu-jitsu-infantil-diadema.jpg',
    imageAlt: 'Capa do segundo vídeo do Projeto Mão Com Mão sobre treino infantil de jiu-jítsu gratuito em Diadema',
    imageOrientation: 'wide',
    youtubeId: 'rmQZDAjKLkI',
    youtubeUrl: 'https://youtu.be/rmQZDAjKLkI',
    videoPublishedAt: '2026-09-04T07:00:30-03:00',
    paragraphs: [
      'O segundo vídeo oficial do canal do Projeto Mão Com Mão apresenta nosso treino infantil de jiu-jítsu gratuito em Diadema, São Paulo.',
      'As aulas ajudam crianças e jovens a desenvolver disciplina, respeito, confiança, convivência e hábitos saudáveis por meio do esporte, em um ambiente de acolhimento e inclusão social.',
      'O projeto realiza suas atividades no Ginásio Rômulo Duncan Arantes, localizado na Avenida Casa Grande, 485, em Diadema. Nossa missão é ampliar o acesso ao jiu-jítsu e transformar vidas dentro e fora do tatame.',
      'Assista ao vídeo, inscreva-se no canal e compartilhe com outras famílias de Diadema que procuram aulas gratuitas de jiu-jítsu para crianças. Cada visualização ajuda o trabalho do Mão Com Mão a alcançar mais pessoas. Oss!'
    ]
  },
  {
    slug: 'turma-crescendo-em-busca-de-novo-espaco',
    title: 'Três turmas cheias e um novo desafio: precisamos de mais espaço',
    excerpt:
      'A foto registra a turma das 19h, mas outras duas turmas de porte semelhante também treinaram na quinta-feira, reforçando a necessidade de um local maior.',
    category: 'Comunidade',
    publishedAt: '2026-09-05',
    publishedLabel: '5 de setembro de 2026',
    eventDate: '2026-09-03',
    eventDateLabel: 'Quinta-feira, 3 de setembro de 2026',
    image: '/images/diario-turma-crescendo-novo-espaco.jpg',
    imageAlt: 'Turma das 19h e professores do Projeto Mão Com Mão reunidos após a aula de jiu-jítsu',
    imageOrientation: 'fourThree',
    paragraphs: [
      'Na última quinta-feira, 3 de setembro, o Projeto Mão Com Mão realizou três turmas de jiu-jítsu. A foto desta matéria registra especificamente o treino das 19h, que encheu o tatame de energia, aprendizado e união.',
      'Além da turma das 19h, outras duas turmas de porte semelhante também participaram das atividades no mesmo dia. Juntas, elas mostram como o projeto continua crescendo, conquistando a confiança das famílias e alcançando cada vez mais crianças e jovens da nossa comunidade.',
      'Esse crescimento é motivo de muita alegria, mas também traz um novo desafio: o espaço atual está ficando pequeno para receber todos com o conforto, a segurança e a estrutura que nossos atletas merecem.',
      'Por isso, o projeto está em busca de um novo local, mais amplo e adequado, onde possamos acolher mais crianças, fortalecer as turmas e ampliar as atividades oferecidas às famílias.',
      'Cada aluno que chega confirma que o esporte transforma vidas. Com união, apoio da comunidade e novas parcerias, seguiremos trabalhando para que o Mão Com Mão tenha um espaço à altura dos sonhos que estão crescendo dentro do tatame. Oss!'
    ]
  },
  {
    slug: 'primeiro-video-canal-jiu-jitsu-infantil',
    title: 'Nosso primeiro vídeo no YouTube: jiu-jítsu infantil em ação',
    excerpt:
      'O Projeto Mão Com Mão estreia seu canal no YouTube com uma aula de jiu-jítsu para crianças, levando a energia do tatame para ainda mais pessoas.',
    category: 'Vídeo',
    publishedAt: '2026-08-29',
    publishedLabel: '29 de agosto de 2026',
    eventDate: '2026-08-29',
    eventDateLabel: 'Sábado, 29 de agosto de 2026',
    image: '/images/diario-primeiro-video-youtube.jpg',
    imageAlt: 'Capa do primeiro vídeo do canal Mão Com Mão no YouTube sobre jiu-jítsu infantil',
    imageOrientation: 'wide',
    youtubeId: 'XVtawvIS5Pk',
    youtubeUrl: 'https://youtu.be/XVtawvIS5Pk',
    paragraphs: [
      'Este é um marco especial para o Projeto Mão Com Mão: publicamos o primeiro vídeo do nosso canal no YouTube.',
      'A estreia apresenta uma aula de jiu-jítsu infantil e leva para o ambiente digital um pouco da alegria, da disciplina e do aprendizado que fazem parte da rotina das nossas crianças no tatame.',
      'O canal será mais uma forma de aproximar famílias, apoiadores e a comunidade do trabalho realizado pelo projeto. Assista, compartilhe e acompanhe os próximos capítulos dessa história. Oss!'
    ]
  },
  {
    slug: 'familias-unidas-futuro-projeto-2027',
    title: 'Famílias e projeto unidos por um novo futuro em 2027',
    excerpt:
      'Reunião com os pais reforça o incentivo aos atletas, o compromisso com o projeto e os planos para conquistar um espaço próprio.',
    category: 'Comunidade',
    publishedAt: '2026-08-13',
    publishedLabel: '13 de agosto de 2026',
    eventDate: '2026-08-13',
    eventDateLabel: 'Quinta-feira, 13 de agosto de 2026',
    image: '/images/diario-reuniao-pais-2027.jpg',
    imageAlt: 'Pais, responsáveis e professores reunidos com o Projeto Mão Com Mão em Diadema',
    imageOrientation: 'wide',
    paragraphs: [
      'O Projeto Mão Com Mão realizou uma reunião com pais e responsáveis para fortalecer o incentivo aos atletas e aproximar ainda mais as famílias da rotina do projeto.',
      'Durante o encontro, conversamos sobre a importância da participação de cada família no desenvolvimento dos alunos, dentro e fora do tatame. O apoio dos pais, a presença nas atividades e o compromisso com os valores do projeto são fundamentais para a evolução esportiva e pessoal de cada atleta.',
      'Também firmamos uma parceria para os próximos passos do Mão Com Mão, unindo pais, responsáveis e iniciativa privada. O objetivo é ampliar a estrutura do projeto e trabalhar pela conquista de um espaço próprio em 2027, preparado para receber nossos alunos e desenvolver novas ações para a comunidade.',
      'Essa união representa uma evolução significativa para a causa do esporte em Diadema. Com planejamento, participação das famílias e apoio de parceiros, muitas coisas boas serão realizadas em 2027. Seguimos construindo esse futuro juntos, mão com mão.'
    ]
  },
  {
    slug: 'voltamos-as-aulas-treino-e-pizza',
    title: 'Voltamos às aulas: treino e pizza',
    excerpt:
      'O segundo semestre começou com treino no tatame e uma confraternização com pizza para a turma.',
    category: 'Comunidade',
    publishedAt: '2026-08-07',
    publishedLabel: '7 de agosto de 2026',
    eventDate: '2026-08-06',
    eventDateLabel: 'Quinta-feira, 6 de agosto de 2026',
    image: '/images/diario-volta-treino-pizza.jpg',
    imageAlt: 'Alunos do Projeto Mão Com Mão reunidos ao redor das pizzas depois do treino',
    imageOrientation: 'portrait',
    paragraphs: [
      'Voltamos às aulas! Na quinta-feira, 6 de agosto, a turma do Projeto Mão Com Mão iniciou o segundo semestre de 2026 com muito treino e energia no tatame.',
      'Depois da aula, os alunos participaram de uma confraternização com pizza, celebrando o reencontro, a amizade e mais uma etapa da nossa caminhada.',
      'Treino, união e alegria para começar o semestre com força. Oss!'
    ]
  },
  {
    slug: 'volta-as-aulas-segundo-semestre-2026',
    title: 'Volta às aulas de Jiu-jítsu — segundo semestre de 2026',
    excerpt:
      'O Projeto Mão Com Mão retoma as aulas de Jiu-jítsu na quinta-feira, 6 de agosto.',
    category: 'Comunicado',
    publishedAt: '2026-07-31',
    publishedLabel: '31 de julho de 2026',
    eventDate: '2026-08-06',
    eventDateLabel: 'Quinta-feira, 6 de agosto de 2026',
    image: '/images/turma-patrocinio-2.jpg',
    imageAlt: 'Alunos e professores do Projeto Mão Com Mão reunidos no tatame',
    paragraphs: [
      'O Projeto Social Mão Com Mão informa que as aulas de Jiu-jítsu do segundo semestre de 2026 retornam no dia 6 de agosto, quinta-feira.',
      'Será o início de mais uma etapa de aprendizado, disciplina, respeito e união para nossos alunos, professores e famílias. Esperamos toda a comunidade para seguirmos crescendo juntos.',
      'Oss!'
    ]
  }
];

export function getDiarioPost(slug: string) {
  return diarioPosts.find((post) => post.slug === slug);
}
