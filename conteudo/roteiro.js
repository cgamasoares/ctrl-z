/* ==========================================================================
   roteiro.js – configuração do site "Do clique ao vinil" (PC da Redação CTRL+Z)

   Tudo que muda sem mexer em código fica aqui: nomes, mídias, pessoas, links
   e recados. Campo vazio ou mídia ausente simplesmente não aparece: o site
   funciona antes de todo o material chegar.

   Caminhos de mídia: escreva "midias/..." (a pasta fica dentro de conteudo/).
   Depois de editar este arquivo ou o materia.md, rode:   node atualizar-conteudo.js
   Para ver as pendências, abra o site com  ?conferir  no final do endereço.
   ========================================================================== */
window.ROTEIRO = {

  /* ---------- Site ---------- */
  site: {
    tituloAba: "Do clique ao vinil – CTRL+Z",
    tituloReportagem: "Do clique ao vinil: o analógico conquista espaço entre os jovens", // só é usado se o materia.md não tiver o título
    tituloCurto: "Do clique ao vinil",     // aparece no pauta.txt
    nomeConta: "Redação CTRL+Z",           // conta única da tela de login
    logo: "midias/fotos/equipe/logo-ctrlz.png",                              // banner CTRL+Z, ex.: "midias/fotos/equipe/logo-ctrlz.png" (vazio = logo em texto)
    fotoGrupo: "midias/fotos/equipe/foto_grupo.jpeg",                         // login, MSG e créditos, ex.: "midias/fotos/equipe/grupo.jpg"
    fotoGrupoDescricao: "Foto de grupo da equipe CTRL+Z",
    papelDeParede: "",                     // foto dos arredores do Bixiga (vazio = fundo azul)
    fundoLogin: "",                        // fundo da tela de login
    bannerSobreAreaDeTrabalho: true        // marca CTRL+Z no canto da área de trabalho
  },

  /* ---------- Equipe (créditos) ----------
     instagram: só o usuário, como "@usuario". Vazio = aparece só o nome. */
  equipe: [
    { nome: "Brenda Teixeira",   instagram: "@brendasteixeira_" },
    { nome: "Camila da Gama",    instagram: "@camis_dogama" },
    { nome: "Igor Rios",         instagram: "@igor.n.rios" },
    { nome: "Lorena de Oliveira", instagram: "@yu.yulore" },
    { nome: "Lilian Xavier",     instagram: "@im.lilianxavier" },
    { nome: "Marina Luna",       instagram: "@maresdemarina" },
    { nome: "Marina Luna",       instagram: "@maresdemarina" }
  ],

  /* ---------- As 9 paradas ----------
     icone     = nome do programa na área de trabalho e no "Continua em: ..."
     nomeCurto = texto da linha da pauta.txt e do recado "lacuna"
     fotoCapa  = (parada 1) foto de capa no e-mail
     videoAbertura = (parada 4) id de um vídeo de "videos", primeiro item da pasta */
  paradas: [
    { numero: 1, icone: "Correio",        nomeCurto: "a pauta",                fotoCapa: "midias/capas/abertura.jpg" },
    { numero: 2, icone: "Rascunho.doc",   nomeCurto: "quem é o Raul" },
    { numero: 3, icone: "Okrute",         nomeCurto: "o movimento" },
    { numero: 4, icone: "Fotos da feira", nomeCurto: "a feira",                videoAbertura: "" },
    { numero: 5, icone: "MSG",            nomeCurto: "a conversa com o Denis" },
    { numero: 6, icone: "Pinta",          nomeCurto: "o preto e branco" },
    { numero: 7, icone: "Toca-discos",    nomeCurto: "o disco" },
    { numero: 8, icone: "Navegador",      nomeCurto: "a pesquisa" },
    { numero: 9, icone: "Meu computador", nomeCurto: "o fechamento" }
  ],

  /* Nome do programa de vídeos (fora do roteiro) */
  extras: { nomeVideos: "Vídeos" },

  /* ---------- Programas ---------- */
  okrute: {
    nome: "Eu amo analógico",       // nome da comunidade
    fotoDestaque: "midias/fotos/feira/okrute-04.jpg",               // foto abaixo do título
    fotoDestaqueDescricao: "Mesa de feira com várias câmeras fotográficas antigas e uma pessoa ao fundo"
  },

  pinta: {
    foto: "",  // foto que abre no Pinta (vazio = ilustração de reserva)
    descricao: "Barracas coloridas da feira ao pôr do sol"  // texto alternativo da foto
  },

  toca: {
    artistas: ["Djavan", "Ney Matogrosso", "Elis Regina", "Adoniran Barbosa", "Cartola", "Tom Jobim"], // só os nomes; não há áudio das músicas
    capa: "midias/fotos/feira/disco-17.jpg",   // imagem da capa do disco (opcional)
    capaDescricao: "Mão segurando a capa do disco Sgt. Pepper’s, dos Beatles, em uma barraca da feira",
    chiado: "",                     // arquivo de chiado de vinil de licença livre (vazio = chiado gerado no navegador)
    chiadoCredito: "",              // crédito do chiado, obrigatório se usar arquivo
    tutorial: ""                    // id do vídeo "Como usar um toca-discos" em "videos" (opcional)
  },

  navegador: {
    endereco: "ctrlz://pesquisa-da-reportagem",
    /* Quantos parágrafos do trecho 8 vão para cada seção, na ordem das seções.
       Vazio = divide em partes iguais. Ex.: [2, 1, 1] */
    paragrafosPorSecao: [2, 1, 1],
    secoes: [
      { id: "brain-rot",  titulo: "Brain rot" },
      { id: "streaming",  titulo: "Streaming e vinil" },
      { id: "ia",         titulo: "Música feita por IA" }
    ]
  },

  /* ---------- Pessoas (aparecem no MSG e entre os membros do Okrute) ----------
     tipo   = "personagem" ou "especialista"
     falas  = citações LITERAIS da reportagem; viram balões. Nenhuma fala é inventada.
     video  = id de um item de "videos" (ativa o botão "Ver entrevista em vídeo")
     parada = a pessoa cuja conversa guarda o trecho daquela parada (só o Denis, na 5) */
  pessoas: [
    { id: "denis", nome: "Denis Chiaverini", tipo: "personagem",
      foto: "midias/fotos/personagens/denis.jpg",
      bio: "Vende equipamentos fotográficos na feira há quase 13 anos.",
      falas: ["No celular você tem a foto, mas você tem rede social, mensagem e câmera. E a câmera é só isso"], // confira com o texto final
      video: "", parada: 5 },
    // { id: "raul", nome: "Raul Gonzaga", tipo: "personagem", ... }  // só com autorização dos responsáveis
  ],

  /* ---------- Fotos ----------
     grupo     = "feira" ou "arredores" (pasta no visualizador)
     descricao = texto alternativo (OBRIGATÓRIO)
     parada    = (opcional) insere a foto no fluxo do texto daquela parada; paragrafo = depois de qual parágrafo
     principal = (opcional) true para aparecer na Matéria completa
     Exemplo:
     { arquivo: "midias/fotos/feira/tenda-01.jpg", grupo: "feira", legenda: "", credito: "", descricao: "" } */
  fotos: [
    { arquivo: "midias/fotos/feira/feira-06.jpg", grupo: "feira", legenda: "Máscaras e esculturas", credito: "Equipe CTRL+Z", descricao: "Máscaras e esculturas africanas penduradas em uma barraca" },
    { arquivo: "midias/fotos/feira/feira-07.jpg", grupo: "feira", legenda: "Esculturas de madeira", credito: "Equipe CTRL+Z", descricao: "Esculturas de madeira sobre uma toalha azul em uma barraca coberta" },
    { arquivo: "midias/fotos/feira/feira-08.jpg", grupo: "feira", legenda: "Antiguidades", credito: "Equipe CTRL+Z", descricao: "Loja de antiguidades com estátua, abajures e móveis" },
    { arquivo: "midias/fotos/feira/feira-09.jpg", grupo: "feira", legenda: "Rádio antigo", credito: "Equipe CTRL+Z", descricao: "Rádio antigo, vermelho e bege, exposto em uma barraca" },
    { arquivo: "midias/fotos/feira/feira-10.jpg", grupo: "feira", legenda: "Brinquedos e bonecos", credito: "Equipe CTRL+Z", descricao: "Mesa com brinquedos, bonecos e objetos coloridos" },
    { arquivo: "midias/fotos/feira/feira-11.jpg", grupo: "feira", legenda: "Peças de prata", credito: "Equipe CTRL+Z", descricao: "Bandejas, talheres e outras peças de prata sobre uma mesa" },
    { arquivo: "midias/fotos/feira/feira-12.jpg", grupo: "feira", legenda: "Objetos antigos", credito: "Equipe CTRL+Z", descricao: "Mesa com câmeras antigas, raquete de tênis, cadeados e outros objetos" },
    { arquivo: "midias/fotos/arredores/entorno-13.jpg", grupo: "arredores", legenda: "Entorno da feira", credito: "Equipe CTRL+Z", descricao: "Barracas brancas da feira vistas da rua, atrás de um canteiro de flores" },
    { arquivo: "midias/fotos/arredores/entorno-14.jpg", grupo: "arredores", legenda: "Esquina no Bixiga", credito: "Equipe CTRL+Z", descricao: "Placas de rua em uma esquina, com um prédio de janelas em arco ao fundo" },
    { arquivo: "midias/fotos/arredores/entorno-15.jpg", grupo: "arredores", legenda: "Rua do bairro", credito: "Equipe CTRL+Z", descricao: "Rua do bairro com árvores e casarões" },
    { arquivo: "midias/fotos/personagens/rascunho-02.jpg", legenda: "Movimento na feira", credito: "Equipe CTRL+Z", descricao: "Visitantes diante de uma barraca da feira, com a vendedora ao centro", parada: 2, paragrafo: 3, principal: true },
    { arquivo: "midias/fotos/feira/okrute-05.jpg", legenda: "Lentes à venda", credito: "Equipe CTRL+Z", descricao: "Lentes de câmeras fotográficas organizadas sobre uma mesa branca, vistas de cima", parada: 3, paragrafo: 1 },
    { arquivo: "midias/fotos/feira/disco-16.jpg", legenda: "Disco de Gilberto Gil", credito: "Equipe CTRL+Z", descricao: "Mão segurando o disco de Gilberto Gil sobre uma caixa de discos", parada: 7, paragrafo: 2 },
    { arquivo: "midias/fotos/feira/navegador-18.jpg", legenda: "Discos e CDs", credito: "Equipe CTRL+Z", descricao: "Pilhas de discos de vinil e CDs em uma barraca", parada: 8, secao: "streaming" },
    { arquivo: "midias/fotos/feira/fechamento-19.jpg", legenda: "Garimpo de discos", credito: "Equipe CTRL+Z", descricao: "Mão folheando uma caixa de discos com placas de classificação", parada: 9, paragrafo: 1, principal: true }
  ],

  /* ---------- Vídeos ----------
     categoria = "entrevistas", "feira" ou "tutoriais"
     arquivo   = caminho local ou URL de um .mp4 hospedado fora (acima de 50 MB, hospede fora)
     legendas  = arquivo .vtt (recomendado)
     topicoOkrute = nome do tópico, se o vídeo também deve aparecer no fórum do Okrute (tutoriais já aparecem)
     Exemplo:
     { id: "feira-geral", arquivo: "midias/videos/feira/feira.mp4", categoria: "feira",
       titulo: "A Feira do Bixiga", capa: "", legendas: "", credito: "" } */
  videos: [
    { id: "feira-geral", arquivo: "midias/videos/feira/feira-geral.mp4", categoria: "feira",
      titulo: "Passeio pela feira", capa: "midias/capas/feira-geral.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "discos", arquivo: "midias/videos/feira/discos.mp4", categoria: "feira",
      titulo: "Discos de vinil na feira", capa: "midias/capas/discos.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "discos-garimpo", arquivo: "midias/videos/feira/discos-garimpo.mp4", categoria: "feira",
      titulo: "Garimpando discos", capa: "midias/capas/discos-garimpo.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "cameras-barraca", arquivo: "midias/videos/feira/cameras-barraca.mp4", categoria: "feira",
      titulo: "Barraca de câmeras", capa: "midias/capas/cameras-barraca.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "cameras-barraca-2", arquivo: "midias/videos/feira/cameras-barraca-2.mp4", categoria: "feira",
      titulo: "Barraca de câmeras 2", capa: "midias/capas/cameras-barraca-2.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "cameras-mesa", arquivo: "midias/videos/feira/cameras-mesa.mp4", categoria: "feira",
      titulo: "Mesa de câmeras", capa: "midias/capas/cameras-mesa.jpg", legendas: "", credito: "Equipe CTRL+Z" },
    { id: "cameras-analogicas", arquivo: "midias/videos/feira/cameras-analogicas.mp4", categoria: "feira",
      titulo: "Câmeras analógicas e digitais", capa: "midias/capas/cameras-analogicas.jpg", legendas: "", credito: "Equipe CTRL+Z" }
  ],

  /* ---------- Links externos (cartão "Ler a fonte original" no Navegador) ---------- */
  links: [
    { secao: "brain-rot", titulo: "", fonte: "g1",        url: "" },
    { secao: "ia",        titulo: "", fonte: "SubmitHub", url: "" }
  ],

  /* ---------- Recados da equipe (aparecem no MSG; texto aceita emoji e Markdown simples) ---------- */
  recados: {
    statusAusente: "Equipe CTRL+Z – na Feira do Bixiga, voltamos já",
    statusOnline:  "Equipe CTRL+Z – de volta da feira",
    inicial: "Oi! A gente saiu pra Feira do Bixiga e deixou o PC ligado de propósito. Comece pelo e-mail da pauta 😉",
    retorno: "Que bom que você voltou! Seguimos de onde você parou.",
    depoisDe: {
      1: "Viu a pauta? O rascunho tá anexado. Abre o rascunho.doc pra conhecer o Raul.",
      2: "O Raul não tá sozinho nessa. Dá uma olhada na nossa comunidade no Okrute.",
      3: "Agora vem com a gente pra feira: separamos as fotos e um vídeo.",
      4: "Conversamos com quem vende câmera lá há anos. Abre a conversa com o Denis no MSG.",
      5: "Quer entender o preto e branco do Raul? Abre o Pinta e testa você mesmo.",
      6: "Hora de virar o disco. Coloca pra tocar no Toca-discos.",
      7: "Essa parte a gente ainda tá digerindo… dá uma olhada na pesquisa nos Favoritos do Navegador.",
      8: "Falta pouco! O fechamento tá em Meu computador, na pasta Meus documentos."
    },
    // Usado quando a próxima sugestão não é a parada seguinte (o visitante pulou etapas).
    // {icone} e {nomeCurto} são trocados pelos valores da parada sugerida.
    lacuna: "Ainda falta {icone}: {nomeCurto}. Quer ver agora?",
    final: "Valeu por ler até aqui. Veja a matéria completa e nos siga no Instagram @ctrlzjornalismo",
    pintaPopup: "Leia antes de pintar"
  }
};
