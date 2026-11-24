/* ==========================================================================
   PC da Redação CTRL+Z – app.js
   Site estático (HTML + CSS + JS puro, sem build) da reportagem
   "Do clique ao vinil". Todo conteúdo vem de conteudo/_gerado.js, que o
   script atualizar-conteudo.js monta a partir de materia.md e roteiro.js.

   Organização deste arquivo:
     1. Utilidades
     2. Conteúdo (matéria e roteiro)
     3. Progresso e recados (módulo de orientação, concluirParada)
     4. Ícones
     5. Janelas, barra de tarefas, menu iniciar, inicialização e login
     6. Programas (Correio, Rascunho.doc, Okrute, Fotos, MSG, Pinta,
        Toca-discos, Navegador, Meu computador, Vídeos)
     7. Encerramento, modo de conferência e partida
   ========================================================================== */
(function () {
"use strict";

/* ===== 0. Verificação do conteúdo gerado ================================ */
const R = window.ROTEIRO;
if (!R || typeof window.MATERIA_MD !== "string") {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = '<p style="font:16px sans-serif;padding:24px">Conteúdo não encontrado. Rode <code>node atualizar-conteudo.js</code> na pasta do site e recarregue a página.</p>';
  });
  return;
}
/* Os caminhos em roteiro.js são escritos como "midias/..." (relativos à pasta conteudo/).
   Aqui eles passam a apontar para conteudo/midias/..., que é onde o navegador os encontra. */
const caminhosDeclarados = [];
(function normalizarMidias(raiz) {
  const visitar = (obj) => {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (typeof v === "string") {
        if (/^midias\//.test(v)) { caminhosDeclarados.push(v); obj[k] = "conteudo/" + v; }
      } else if (v && typeof v === "object") visitar(v);
    });
  };
  visitar(raiz);
})(R);
const S = R.site || {};
const TOTAL = 9;
const MIDIAS = Array.isArray(window.MIDIAS_NA_PASTA) ? window.MIDIAS_NA_PASTA : null;
const CONFERIR = /[?&]conferir(?:[=&]|$)/.test(location.search);

/* ===== 1. Utilidades ==================================================== */
const $ = (s, r) => (r || document).querySelector(s);

/** Cria um elemento: h("div", {class:"x", onclick:fn}, filhos...) */
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  filhos.flat(Infinity).forEach((f) => {
    if (f == null || f === false) return;
    el.append(f.nodeType ? f : document.createTextNode(String(f)));
  });
  return el;
}
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mdInline = (s) => { try { return window.marked ? window.marked.parseInline(String(s)) : esc(s); } catch (e) { return esc(s); } };
const mdBloco = (s) => { try { return window.marked ? window.marked.parse(String(s)) : "<p>" + esc(s) + "</p>"; } catch (e) { return "<p>" + esc(s) + "</p>"; } };
const ehMobile = () => window.matchMedia("(max-width:700px), (max-height:500px)").matches;
const reduzMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lista = (v) => (Array.isArray(v) ? v : []);

/** Imagem que some sem deixar buraco se o arquivo não existir. */
function img(src, alt, cls) {
  if (!src) return null;
  return h("img", { src, alt: alt || "", class: cls || "", loading: "lazy", draggable: "false",
    onerror() { this.classList.add("quebrada"); this.removeAttribute("alt"); } });
}
/** Avatar com foto ou, sem foto, com a inicial do nome. */
function avatar(foto, nome, cls) {
  const box = h("span", { class: "avatar " + (cls || ""), "aria-hidden": "true" });
  box.append(h("span", { class: "avatar-letra" }, (nome || "?").trim().charAt(0).toUpperCase()));
  if (foto) box.append(h("img", { src: foto, alt: "", onerror() { this.remove(); } }));
  return box;
}

/* ----- Armazenamento (sempre com try/catch) ----- */
const CHAVE = "ctrlz-reportagem-v1";
function lerSalvo() {
  try { const t = window.localStorage.getItem(CHAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; }
}
function gravar() {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({
      concluidas: Array.from(estado.concluidas), recados: estado.recados.slice(-60), visitou: true,
    }));
  } catch (e) { /* sem armazenamento: o site segue funcionando, só não lembra */ }
}
function apagarSalvo() { try { window.localStorage.removeItem(CHAVE); } catch (e) { /* idem */ } }

const estado = { concluidas: new Set(), recados: [], visitou: false, som: !ehMobile() }; /* ligado no computador, desligado no celular */
(function carregar() {
  const s = lerSalvo();
  if (!s) return;
  estado.visitou = true;
  lista(s.concluidas).forEach((n) => { if (n >= 1 && n <= TOTAL) estado.concluidas.add(n); });
  estado.recados = lista(s.recados).filter((r) => r && typeof r.texto === "string");
})();

/* ===== 2. Conteúdo: matéria e roteiro =================================== */
const avisosMateria = [];
const trechos = {};
let materiaCompleta = "";
(function analisarMateria() {
  const md = String(window.MATERIA_MD).replace(/\r\n?/g, "\n");
  const re = /^<!--\s*parada:\s*(\d+)\s*-->[ \t]*$/gm;
  const marcas = [];
  let m;
  while ((m = re.exec(md))) marcas.push({ n: +m[1], ini: m.index, fim: m.index + m[0].length });
  marcas.forEach((mk, i) => {
    const fim = i + 1 < marcas.length ? marcas[i + 1].ini : md.length;
    trechos[mk.n] = md.slice(mk.fim, fim).replace(/^\n+/, "").replace(/\s+$/, "");
  });
  for (let n = 1; n <= TOTAL; n++) if (!(n in trechos)) avisosMateria.push("Marcador ausente: <!-- parada: " + n + " -->");
  marcas.forEach((mk, i) => { if (mk.n !== i + 1) avisosMateria.push("Marcador fora de ordem: parada " + mk.n + " na posição " + (i + 1)); });
  if (marcas.length && md.slice(0, marcas[0].ini).trim()) avisosMateria.push("Há texto antes do marcador da parada 1; ele não aparece em nenhuma parada.");
  if (!marcas.length) avisosMateria.push("materia.md não tem nenhum marcador de parada.");
  for (let n = 1; n <= TOTAL; n++) if (trechos[n] && /\[Cole aqui|lorem ipsum/i.test(trechos[n])) avisosMateria.push("Parada " + n + " ainda tem texto provisório.");
  const ordenados = Object.keys(trechos).map(Number).sort((a, b) => a - b);
  materiaCompleta = ordenados.map((n) => trechos[n]).filter(Boolean).join("\n\n");
  avisosMateria.forEach((a) => console.warn("[CTRL+Z] " + a.replace(/<[^>]+>/g, "")));
})();

/** Converte um bloco de Markdown em HTML. Citações [destaque] e [jornal] viram caixas próprias. */
function mdParaHtml(md) {
  if (!md) return "";
  return String(md).split(/\n{2,}/).map((bloco) => {
    const mt = bloco.match(/^\[(destaque|jornal)\]\s*([\s\S]*)$/);
    if (mt) return '<blockquote class="cit-' + mt[1] + '">' + mdInline(mt[2]) + "</blockquote>";
    return mdBloco(bloco);
  }).join("\n");
}

/** Cria o trecho de uma parada: { raiz, trecho, fim }. O fim é a linha "Continua em". */
function blocoTrecho(n, opcoes) {
  opcoes = opcoes || {};
  const trecho = h("div", { class: "materia", "data-parada": n });
  let md = trechos[n] || "";
  if (n === 1 && opcoes.semTitulo) md = partesParada1().corpo;
  trecho.innerHTML = mdParaHtml(md);
  inserirFiguras(trecho, n);
  const fim = rodape(n);
  const raiz = h("div", { class: "trecho-wrap" }, trecho, fim);
  return { raiz, trecho, fim };
}

/** Parada 1: título (# ...), linha fina (parágrafo seguinte) e o resto. */
function partesParada1() {
  const md = trechos[1] || "";
  const linhas = md.split("\n");
  let titulo = "", resto = md;
  const i = linhas.findIndex((l) => /^#\s+/.test(l));
  if (i >= 0) {
    titulo = linhas[i].replace(/^#\s+/, "").trim();
    resto = linhas.slice(i + 1).join("\n").replace(/^\n+/, "");
  }
  const blocos = resto.split(/\n{2,}/);
  const linhaFina = (blocos.shift() || "").trim();
  return { titulo: titulo || S.tituloReportagem || "", linhaFina, corpo: blocos.join("\n\n") };
}

/** Fotos configuradas com `parada: n` entram no fluxo do texto (depois do parágrafo `paragrafo`, ou no fim). */
function inserirFiguras(trecho, n) {
  const fs = lista(R.fotos).filter((f) => f.parada === n && f.arquivo && !f.secao);
  if (!fs.length) return;
  fs.forEach((f) => {
    const fig = figura(f);
    const ps = Array.from(trecho.children).filter((e) => e.tagName === "P");
    const alvo = f.paragrafo && ps[f.paragrafo - 1];
    if (alvo) alvo.after(fig); else trecho.append(fig);
  });
}
function figura(f) {
  return h("figure", { class: "figura" },
    img(f.arquivo, f.descricao),
    (f.legenda || f.credito) && h("figcaption", {}, f.legenda || "", f.credito ? h("span", { class: "credito" }, (f.legenda ? " " : "") + "Foto: " + f.credito) : null));
}

/* ----- Roteiro: nomes e buscas ----- */
const NOMES_PADRAO = ["Correio", "Rascunho.doc", "Okrute", "Fotos da feira", "MSG", "Pinta", "Toca-discos", "Navegador", "Meu computador"];
function paradaCfg(n) {
  const p = lista(R.paradas).filter((x) => x.numero === n)[0] || {};
  return { numero: n, icone: p.icone || NOMES_PADRAO[n - 1], nomeCurto: p.nomeCurto || "", fotoCapa: p.fotoCapa || "", videoAbertura: p.videoAbertura || "" };
}
const nomeVideosPrograma = () => (R.extras && R.extras.nomeVideos) || "Vídeos";
const videoPorId = (id) => lista(R.videos).filter((v) => v.id === id)[0] || null;
const pessoaPorId = (id) => lista(R.pessoas).filter((p) => p.id === id)[0] || null;
const nomeConta = () => S.nomeConta || "Redação CTRL+Z";
const rec = (k) => (R.recados && R.recados[k]) || "";
const tituloReportagem = () => partesParada1().titulo || S.tituloReportagem || "Do clique ao vinil";
const tituloCurto = () => S.tituloCurto || "Do clique ao vinil";

/** Links externos: só http(s). */
const urlSegura = (u) => (/^https?:\/\//i.test(String(u || "")) ? u : "");

/* ===== 3. Progresso e recados ============================================ */
const proximaSugerida = () => { for (let n = 1; n <= TOTAL; n++) if (!estado.concluidas.has(n)) return n; return null; };
const statusEquipe = () => (estado.concluidas.size >= TOTAL ? rec("statusOnline") : rec("statusAusente"));
const ouvintes = { progresso: [], recado: [] };

/** Chamada por cada programa quando o trecho da parada foi lido. */
function concluirParada(n) {
  if (n < 1 || n > TOTAL || estado.concluidas.has(n)) return;
  estado.concluidas.add(n);
  gravar();
  ouvintes.progresso.forEach((f) => f());
  if (estado.concluidas.size >= TOTAL) {
    agendarRecado(rec("final"), "encerramento", 1500);
    return;
  }
  const prox = proximaSugerida();
  let texto;
  if (prox === n + 1) texto = (R.recados.depoisDe || {})[n];
  else {
    const p = paradaCfg(prox);
    texto = rec("lacuna").replace(/\{icone\}/g, p.icone).replace(/\{nomeCurto\}/g, p.nomeCurto);
  }
  if (texto) agendarRecado(texto, prox, 1500);
}

let timerRecado = null;
/** Só o recado mais recente aparece: um novo agendamento cancela o anterior. */
function agendarRecado(texto, destino, atraso, comBalao) {
  clearTimeout(timerRecado);
  timerRecado = setTimeout(() => {
    estado.recados.push({ texto, destino });
    gravar();
    ouvintes.recado.forEach((f) => f());
    mostrarNotificacao(texto, destino);
    if (comBalao) mostrarBalao("1 nova mensagem");
    Som.bip("msg");
  }, atraso);
}
function cancelarRecados() { clearTimeout(timerRecado); }

function abrirDestino(destino) {
  if (destino === "encerramento") abrirEncerramento();
  else if (destino >= 1 && destino <= TOTAL) abrirParada(destino);
}

/* ----- Notificação (canto inferior direito; topo no celular) e balão da bandeja ----- */
let timerNotif = null;
function mostrarNotificacao(texto, destino) {
  const area = $("#notificacoes");
  if (!area) return;
  fecharNotificacao();
  const n = h("div", { class: "notif", role: "status", "aria-live": "polite" },
    avatar(S.fotoGrupo, nomeConta(), "avatar-notif"),
    h("div", { class: "notif-texto" },
      h("strong", {}, "Equipe CTRL+Z"),
      h("div", { class: "notif-msg", html: mdInline(texto) })),
    h("div", { class: "notif-botoes" },
      h("button", { type: "button", class: "btn-xp primario", onclick() { fecharNotificacao(); abrirDestino(destino); } }, "Abrir"),
      h("button", { type: "button", class: "btn-xp", onclick: fecharNotificacao }, "Depois")));
  area.append(n);
  timerNotif = setTimeout(fecharNotificacao, 12000);
}
function fecharNotificacao() {
  clearTimeout(timerNotif);
  const area = $("#notificacoes");
  if (area) area.innerHTML = "";
}
let timerBalao = null;
function mostrarBalao(texto) {
  const area = $("#balao");
  if (!area) return;
  area.textContent = texto;
  area.hidden = false;
  clearTimeout(timerBalao);
  timerBalao = setTimeout(() => { area.hidden = true; }, 5000);
}

/* ----- Leitura: quando uma parada conta como concluída ----- */
/**
 * Vigia o trecho de uma parada. Conclui quando:
 *  - o visitante rolou até o fim (a linha "Continua em" fica visível); ou
 *  - o trecho cabe inteiro na tela e fica visível por 3 segundos.
 */
function vigiar(j, trecho, fim, n) {
  if (estado.concluidas.has(n)) return () => {};
  let rolou = false, timer = null, terminou = false;
  const razao = { trecho: 0, fim: 0 };
  const parar = () => { terminou = true; clearTimeout(timer); if (io) io.disconnect(); clearInterval(poll); j.el.removeEventListener("scroll", aoRolar, true); };
  const avaliar = () => {
    if (terminou) return;
    if (razao.fim >= 0.9 && rolou) { parar(); concluirParada(n); return; }
    if (razao.trecho >= 0.98) {
      if (!timer) timer = setTimeout(() => { if (!terminou && razao.trecho >= 0.98) { parar(); concluirParada(n); } }, 3000);
    } else if (timer) { clearTimeout(timer); timer = null; }
  };
  const aoRolar = () => { rolou = true; if (!io) medir(); avaliar(); };
  j.el.addEventListener("scroll", aoRolar, true);
  let io = null, poll = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.target === trecho) razao.trecho = e.intersectionRatio; else razao.fim = e.intersectionRatio; });
      avaliar();
    }, { threshold: [0, 0.25, 0.5, 0.9, 0.98, 1] });
    io.observe(trecho);
    if (fim) io.observe(fim);
  } else {
    /* Plano B sem IntersectionObserver: mede o retângulo contra a área da janela. */
    poll = setInterval(() => { medir(); avaliar(); }, 400);
  }
  function medir() {
    const area = j.corpo.getBoundingClientRect();
    const razaoDe = (el) => {
      if (!el || !el.offsetParent) return 0;
      const r = el.getBoundingClientRect();
      const a = r.width * r.height;
      if (!a) return 0;
      const w = Math.max(0, Math.min(r.right, area.right) - Math.max(r.left, area.left));
      const hh = Math.max(0, Math.min(r.bottom, area.bottom) - Math.max(r.top, area.top));
      return (w * hh) / a;
    };
    razao.trecho = razaoDe(trecho);
    razao.fim = razaoDe(fim);
  }
  j.limpezas.push(parar);
  return parar;
}

/** Linha "Continua em: ..." no fim de todo trecho (aponta para a parada seguinte no texto). */
function rodape(n) {
  if (n >= TOTAL) {
    return h("button", { type: "button", class: "rodape-continua", onclick: () => abrirEncerramento() }, "Fim da reportagem");
  }
  const proximo = paradaCfg(n + 1);
  return h("button", { type: "button", class: "rodape-continua", onclick: () => abrirParada(n + 1) }, "Continua em: " + proximo.icone);
}

/* ===== 4. Ícones (todos originais, desenhados em SVG) ===================== */
const ICONES = {
  "Correio": '<rect x="5" y="11" width="38" height="27" rx="3" fill="#f6f1e3" stroke="#3b5ea8" stroke-width="2"/><path d="M6 13l18 14L42 13" fill="none" stroke="#3b5ea8" stroke-width="2.2" stroke-linejoin="round"/><circle cx="38" cy="12" r="6" fill="#e8472b"/>',
  "Rascunho.doc": '<path d="M11 4h20l8 8v32H11z" fill="#fff" stroke="#3b5ea8" stroke-width="2"/><path d="M31 4v8h8" fill="#cfe0fb" stroke="#3b5ea8" stroke-width="2"/><rect x="11" y="16" width="14" height="5" fill="#3b7de0"/><path d="M16 27h18M16 32h18M16 37h12" stroke="#8a97ad" stroke-width="2"/>',
  "Okrute": '<rect x="5" y="5" width="38" height="38" rx="10" fill="#1d9a9a"/><circle cx="18" cy="19" r="5.5" fill="#fff"/><circle cx="32" cy="21" r="4.5" fill="#ffd36b"/><path d="M8 39c1-8 6-10 10-10s9 2 10 10zM26 39c.5-6 3-8 6-8s6 2 7 8z" fill="#fff"/>',
  "Fotos da feira": '<path d="M4 12h14l4 4h22v26H4z" fill="#f2c14e" stroke="#a87a10" stroke-width="2"/><rect x="12" y="20" width="24" height="16" rx="1.5" fill="#fff" stroke="#6b7b8c"/><circle cx="19" cy="26" r="2.5" fill="#f2994a"/><path d="M13 35l8-7 5 4 4-3 6 6z" fill="#4fa36a"/>',
  "MSG": '<path d="M6 8h24a4 4 0 014 4v12a4 4 0 01-4 4H17l-8 7v-7H6a4 4 0 01-4-4V12a4 4 0 014-4z" fill="#3f8fe0" stroke="#1f5fae" stroke-width="2"/><circle cx="18" cy="17" r="3.2" fill="#fff"/><path d="M11 25c1-4 3-5 7-5s6 1 7 5z" fill="#fff"/><path d="M30 24h11a4 4 0 014 4v8a4 4 0 01-4 4h-2v5l-6-5h-3a4 4 0 01-4-4v-8a4 4 0 014-4z" fill="#6cc04a" stroke="#3d8a22" stroke-width="2"/>',
  "Pinta": '<path d="M24 5C12 5 4 13 4 23c0 9 7 14 14 14 4 0 4-3 3-5-1-3 1-5 4-5h9c5 0 10-3 10-9C44 11 35 5 24 5z" fill="#f3e2c0" stroke="#9a6b2b" stroke-width="2"/><circle cx="15" cy="20" r="3.2" fill="#e8472b"/><circle cx="24" cy="14" r="3.2" fill="#f2c14e"/><circle cx="34" cy="18" r="3.2" fill="#3f8fe0"/><circle cx="14" cy="30" r="3.2" fill="#4fa36a"/>',
  "Toca-discos": '<rect x="4" y="8" width="40" height="34" rx="4" fill="#8b5a2b" stroke="#4a2f14" stroke-width="2"/><circle cx="22" cy="26" r="13" fill="#1b1b1f"/><circle cx="22" cy="26" r="9" fill="none" stroke="#3a3a44" stroke-width="1"/><circle cx="22" cy="26" r="5" fill="#e8472b"/><circle cx="22" cy="26" r="1.2" fill="#fff"/><path d="M40 12l-8 14" stroke="#d9d9d9" stroke-width="3" stroke-linecap="round"/>',
  "Navegador": '<circle cx="24" cy="24" r="18" fill="#3f8fe0" stroke="#1f5fae" stroke-width="2"/><path d="M6 24h36M24 6c-8 6-8 30 0 36M24 6c8 6 8 30 0 36M10 14h28M10 34h28" fill="none" stroke="#fff" stroke-width="1.8"/>',
  "Meu computador": '<rect x="6" y="6" width="36" height="26" rx="3" fill="#dfe7f3" stroke="#46546b" stroke-width="2"/><rect x="10" y="10" width="28" height="18" fill="#3f8fe0"/><path d="M18 41h12l2-8H16z" fill="#c8cfdb" stroke="#46546b" stroke-width="2"/>',
  "Vídeos": '<rect x="5" y="9" width="38" height="30" rx="4" fill="#2b2f3a" stroke="#14161c" stroke-width="2"/><path d="M20 17v14l12-7z" fill="#ffd36b"/><path d="M9 13h2M9 20h2M9 27h2M9 34h2M37 13h2M37 20h2M37 27h2M37 34h2" stroke="#8a93a5" stroke-width="2"/>',
  "Pauta": '<rect x="8" y="6" width="32" height="38" rx="3" fill="#fffbe0" stroke="#8a7b2b" stroke-width="2"/><path d="M14 16h20M14 23h20M14 30h14" stroke="#8a7b2b" stroke-width="2"/><path d="M14 4v6M24 4v6M34 4v6" stroke="#46546b" stroke-width="3" stroke-linecap="round"/>',
  "Som": '<path d="M6 18h8l10-8v28l-10-8H6z" fill="#46546b"/><path d="M30 17c3 4 3 10 0 14M35 12c6 7 6 17 0 24" fill="none" stroke="#46546b" stroke-width="3" stroke-linecap="round"/>',
  "SomMudo": '<path d="M6 18h8l10-8v28l-10-8H6z" fill="#46546b"/><path d="M30 18l12 12M42 18L30 30" fill="none" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round"/>',
  "Iniciar": '<circle cx="24" cy="24" r="19" fill="#fff"/><path d="M15 21h13a7 7 0 010 14h-9" fill="none" stroke="#2f8f2f" stroke-width="4.5" stroke-linecap="round"/><path d="M20 14l-7 7 7 7" fill="none" stroke="#2f8f2f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  "Arquivo": '<path d="M11 4h20l8 8v32H11z" fill="#fff" stroke="#3b5ea8" stroke-width="2"/><path d="M31 4v8h8" fill="#cfe0fb" stroke="#3b5ea8" stroke-width="2"/><path d="M16 22h18M16 28h18M16 34h12" stroke="#8a97ad" stroke-width="2"/>',
  "Pasta": '<path d="M4 12h14l4 4h22v26H4z" fill="#f2c14e" stroke="#a87a10" stroke-width="2"/>',
  "Usuario": '<circle cx="24" cy="17" r="8" fill="#fff"/><path d="M8 42c1-11 8-15 16-15s15 4 16 15z" fill="#fff"/>',
  "Disco": '<circle cx="24" cy="24" r="20" fill="#1b1b1f"/><circle cx="24" cy="24" r="6" fill="#e8472b"/>',
};
function icone(nome, classe) {
  const span = h("span", { class: "ico " + (classe || ""), "aria-hidden": "true" });
  span.innerHTML = '<svg viewBox="0 0 48 48" focusable="false">' + (ICONES[nome] || ICONES["Arquivo"]) + "</svg>";
  return span;
}

/* ===== Som (começa desligado; nenhum som toca sem ação do visitante) ===== */
const Som = (() => {
  let ctx = null, fonteChiado = null, audioChiado = null;
  function garantir() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    return ctx;
  }
  function nota(freq, ini, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ini);
    g.gain.exponentialRampToValueAtTime(vol, ini + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(ini); o.stop(ini + dur + 0.02);
  }
  /** Sons curtos gerados no próprio navegador (originais). */
  function bip(tipo) {
    if (!estado.som) return;
    const c = garantir();
    if (!c) return;
    const t = c.currentTime;
    if (tipo === "msg") { nota(660, t, 0.14, 0.05); nota(880, t + 0.14, 0.2, 0.05); }
    else if (tipo === "abrir") nota(520, t, 0.06, 0.025);
  }
  /** Chiado de vinil: arquivo configurado em toca.chiado ou ruído gerado aqui, sem direitos de terceiros. */
  function chiadoIniciar() {
    chiadoParar();
    if (!estado.som) return;
    const arq = R.toca && R.toca.chiado;
    if (arq) {
      audioChiado = new Audio(arq); audioChiado.loop = true; audioChiado.volume = 0.4;
      const p = audioChiado.play(); if (p && p.catch) p.catch(() => {});
      return;
    }
    const c = garantir();
    if (!c) return;
    const dur = 3, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    let pop = 0;
    for (let i = 0; i < n; i++) {
      let v = (Math.random() * 2 - 1) * 0.012;
      if (Math.random() < 0.0007) pop = (Math.random() * 2 - 1) * 0.5;
      v += pop; pop *= 0.88;
      d[i] = v;
    }
    fonteChiado = c.createBufferSource(); fonteChiado.buffer = buf; fonteChiado.loop = true;
    const g = c.createGain(); g.gain.value = 0.6;
    fonteChiado.connect(g); g.connect(c.destination); fonteChiado.start();
  }
  function chiadoParar() {
    if (fonteChiado) { try { fonteChiado.stop(); } catch (e) { /* já parado */ } fonteChiado = null; }
    if (audioChiado) { audioChiado.pause(); audioChiado = null; }
  }
  return { bip, chiadoIniciar, chiadoParar };
})();
const ouvintesSom = [];
function alternarSom() {
  estado.som = !estado.som;
  if (!estado.som) Som.chiadoParar();
  ouvintesSom.forEach((f) => f());
}

/* ===== 5. Janelas, barra de tarefas, menu iniciar ========================= */
const janelas = new Map();
let zTop = 20, cascata = 0;

function abrirJanela(cfg) {
  const existente = janelas.get(cfg.id);
  if (existente) { trazer(existente); return existente; }
  /* Uma janela por vez: abrir um programa fecha o anterior. */
  Array.from(janelas.values()).forEach(fechar);
  const area = $("#janelas");
  const aw = area.clientWidth || window.innerWidth, ah = area.clientHeight || window.innerHeight - 40;
  const w = Math.min(cfg.w || 760, aw - 16), alt = Math.min(cfg.h || 500, ah - 16);
  const off = (cascata++ % 6) * 26;
  const left = Math.max(4, Math.round((aw - w) / 2) - 70 + off), top = Math.max(4, Math.round((ah - alt) / 2) - 30 + off);
  const j = { id: cfg.id, cfg, el: null, corpo: h("div", { class: "janela-corpo" }), limpezas: [], api: {}, aoVoltar: null, btn: null, max: false, min: false };

  const bMin = h("button", { type: "button", class: "ctl ctl-min", "aria-label": "Minimizar", onclick: () => minimizar(j) }, "_");
  const bMax = h("button", { type: "button", class: "ctl ctl-max", "aria-label": "Maximizar", onclick: () => maximizar(j) }, "□");
  const bFechar = h("button", { type: "button", class: "ctl ctl-fechar", "aria-label": "Fechar", onclick: () => fechar(j) }, "×");
  const bVoltar = h("button", { type: "button", class: "btn-voltar", onclick: () => { if (j.aoVoltar && j.aoVoltar()) return; fechar(j); } }, "‹ Voltar");
  const barra = h("div", { class: "barra" }, bVoltar, icone(cfg.icone, "ico-barra"), h("span", { class: "barra-titulo" }, cfg.titulo), h("div", { class: "controles" }, bMin, bMax, bFechar));
  j.el = h("div", { class: "janela " + (cfg.classe || ""), role: "dialog", "aria-label": cfg.titulo, tabindex: "-1", "data-id": cfg.id,
    style: { left: left + "px", top: top + "px", width: w + "px", height: alt + "px", zIndex: ++zTop } }, barra, j.corpo);

  j.btn = h("button", { type: "button", class: "tarefa", title: cfg.titulo, onclick() {
    if (j.min) trazer(j); else if (j.el.classList.contains("ativa")) minimizar(j); else focar(j);
  } }, icone(cfg.icone, "ico-tarefa"), h("span", {}, cfg.titulo));

  /* Arrastar pela barra de título (só no computador) */
  barra.addEventListener("pointerdown", (e) => {
    if (ehMobile() || j.max || e.target.closest("button")) return;
    const r0 = j.el.getBoundingClientRect(), ar = area.getBoundingClientRect();
    const dx = e.clientX - r0.left, dy = e.clientY - r0.top;
    try { barra.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const mover = (ev) => {
      j.el.style.left = Math.min(Math.max(ev.clientX - dx - ar.left, 80 - r0.width), ar.width - 80) + "px";
      j.el.style.top = Math.min(Math.max(ev.clientY - dy - ar.top, 0), ar.height - 30) + "px";
    };
    const soltar = () => { barra.removeEventListener("pointermove", mover); barra.removeEventListener("pointerup", soltar); barra.removeEventListener("pointercancel", soltar); };
    barra.addEventListener("pointermove", mover); barra.addEventListener("pointerup", soltar); barra.addEventListener("pointercancel", soltar);
  });
  barra.addEventListener("dblclick", (e) => { if (!ehMobile() && !e.target.closest("button")) maximizar(j); });
  j.el.addEventListener("pointerdown", () => focar(j));
  j.el.addEventListener("keydown", (e) => { if (e.key === "Escape" && !ehMobile() && !e.target.closest("input,select,textarea")) { e.stopPropagation(); fechar(j); } });

  area.append(j.el);
  $("#tarefas").append(j.btn);
  janelas.set(cfg.id, j);
  try { cfg.montar(j); } catch (err) { console.error("[CTRL+Z] erro ao montar " + cfg.id, err); j.corpo.append(h("p", { class: "erro-janela" }, "Não foi possível abrir este programa.")); }
  focar(j);
  Som.bip("abrir");
  return j;
}
function focar(j) {
  janelas.forEach((x) => { x.el.classList.remove("ativa"); x.btn.classList.remove("ativa"); });
  j.el.style.zIndex = ++zTop;
  j.el.classList.add("ativa"); j.btn.classList.add("ativa");
}
function trazer(j) {
  if (j.min) { j.min = false; j.el.classList.remove("minimizada"); }
  focar(j);
}
function minimizar(j) { j.min = true; j.el.classList.add("minimizada"); j.el.classList.remove("ativa"); j.btn.classList.remove("ativa"); }
function maximizar(j) { j.max = !j.max; j.el.classList.toggle("max", j.max); }
function fechar(j) {
  j.limpezas.forEach((f) => { try { f(); } catch (e) { /* ok */ } });
  j.limpezas = [];
  if (j.cfg.aoFechar) j.cfg.aoFechar(j);
  j.el.remove(); j.btn.remove();
  janelas.delete(j.id);
  const restantes = Array.from(janelas.values()).filter((x) => !x.min);
  if (restantes.length) focar(restantes[restantes.length - 1]);
}
function fecharTodas() { Array.from(janelas.values()).forEach(fechar); }

/* ----- Programas na ordem da área de trabalho (3 colunas, esquerda para direita) ----- */
const PROGS = [
  { id: "correio", parada: 1, abrir: () => abrirCorreio() },
  { id: "rascunho", parada: 2, abrir: () => abrirRascunho() },
  { id: "okrute", parada: 3, abrir: () => abrirOkrute() },
  { id: "fotos", parada: 4, abrir: () => abrirFotos() },
  { id: "msg", parada: 5, abrir: () => abrirMSG() },
  { id: "pinta", parada: 6, abrir: () => abrirPinta() },
  { id: "toca", parada: 7, abrir: () => abrirToca() },
  { id: "navegador", parada: 8, abrir: () => abrirNavegador() },
  { id: "computador", parada: 9, abrir: () => abrirComputador() },
  { id: "videos", parada: 0, abrir: () => abrirVideos() },
];
const nomeProg = (p) => (p.parada ? paradaCfg(p.parada).icone : nomeVideosPrograma());
const iconeProg = (p) => (p.parada ? NOMES_PADRAO[p.parada - 1] : "Vídeos");
function abrirParada(n) {
  if (n === 5) return abrirMSG(contatoDaParada5());
  PROGS[n - 1].abrir();
}

/* ----- Estrutura do desktop ----- */
let desktopPronto = false;
function construirDesktop() {
  if (desktopPronto) return;
  desktopPronto = true;
  const area = $("#area");
  if (S.papelDeParede) area.style.backgroundImage = "url('" + String(S.papelDeParede).replace(/'/g, "%27") + "')";
  const icones = $("#icones");
  PROGS.forEach((p) => {
    icones.append(h("button", { type: "button", class: "icone-area", "data-parada": p.parada, onclick: () => p.abrir() },
      icone(iconeProg(p), "grande"), h("span", { class: "icone-nome" }, nomeProg(p))));
  });
  /* Marca CTRL+Z sobre a área de trabalho (opção em roteiro.js, ligada por padrão) */
  if (S.bannerSobreAreaDeTrabalho !== false) $("#marca").append(logoCtrlz("marca-logo"));

  /* Botão iniciar */
  $("#btn-iniciar").replaceChildren(icone("Iniciar", "ico-iniciar"), h("span", {}, "iniciar"));
  $("#btn-iniciar").addEventListener("click", (e) => { e.stopPropagation(); alternarMenu(); });

  /* Bandeja: Pauta, Som, MSG e relógio */
  const bPauta = h("button", { type: "button", class: "bandeja-btn", id: "bt-pauta", "aria-label": "Abrir pauta.txt", title: "Pauta", onclick: () => abrirPauta() }, icone("Pauta"), h("span", { class: "selo", id: "selo-pauta" }, "0/" + TOTAL));
  const bSom = h("button", { type: "button", class: "bandeja-btn", id: "bt-som", onclick: alternarSom });
  const bMsg = h("button", { type: "button", class: "bandeja-btn", id: "bt-msg", "aria-label": "Abrir MSG", onclick: () => abrirMSG() }, icone("MSG"));
  $("#bandeja").replaceChildren(bPauta, bSom, bMsg, h("span", { class: "relogio", id: "relogio" }));
  const sincronizarSom = () => {
    bSom.setAttribute("aria-pressed", String(estado.som));
    bSom.setAttribute("aria-label", "Efeitos sonoros: " + (estado.som ? "ligados" : "desligados"));
    bSom.title = "Som: " + (estado.som ? "ligado" : "desligado");
    bSom.replaceChildren(icone(estado.som ? "Som" : "SomMudo"));
  };
  ouvintesSom.push(sincronizarSom);
  sincronizarSom();
  const relogio = () => { const d = new Date(); $("#relogio").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  relogio(); setInterval(relogio, 30000);

  /* Botão Recomeçar a visita: fixo no canto superior direito da tela; só aparece depois que todas as partes foram lidas */
  $("#desktop").append(h("button", { type: "button", id: "btn-reiniciar", class: "btn-xp btn-reiniciar", hidden: true, onclick: confirmarReinicio }, "Recomeçar a visita"));
  ouvintes.progresso.push(atualizarProgressoUI);
  atualizarProgressoUI();
  construirMenuIniciar();
}

function logoCtrlz(cls) {
  const box = h("span", { class: "logo-ctrlz " + (cls || "") });
  if (S.logo) box.append(h("img", { src: S.logo, alt: "CTRL+Z", onerror() { this.remove(); box.append(logoTexto()); } }));
  else box.append(logoTexto());
  return box;
}
function logoTexto() { return h("span", { class: "logo-texto", role: "img", "aria-label": "CTRL+Z" }, "CTRL", h("b", {}, "+Z")); }

/** Brilho no ícone sugerido, selo da pauta, pauta aberta e status da equipe. */
function atualizarProgressoUI() {
  const prox = proximaSugerida();
  const terminou = estado.concluidas.size >= TOTAL;
  const br = $("#btn-reiniciar");
  if (br) br.hidden = !terminou;
  document.body.classList.toggle("final", terminou);
  if (!terminou) { const c = $("#confirma-reinicio"); if (c) c.remove(); }
  document.querySelectorAll(".icone-area").forEach((b) => b.classList.toggle("sugerida", prox != null && +b.dataset.parada === prox));
  const selo = $("#selo-pauta");
  if (selo) selo.textContent = estado.concluidas.size + "/" + TOTAL;
  const bm = $("#bt-msg");
  if (bm) { bm.title = statusEquipe(); bm.setAttribute("aria-label", "Abrir MSG. " + statusEquipe()); }
  const pauta = janelas.get("pauta");
  if (pauta && pauta.api.atualizar) pauta.api.atualizar();
  const msg = janelas.get("msg");
  if (msg && msg.api.atualizar) msg.api.atualizar();
}
ouvintes.recado.push(() => { const msg = janelas.get("msg"); if (msg && msg.api.atualizar) msg.api.atualizar(); });

/* ----- Menu iniciar ----- */
function construirMenuIniciar() {
  const menu = $("#menu-iniciar");
  const esq = h("div", { class: "mi-esq", role: "menu" }, PROGS.map((p) =>
    h("button", { type: "button", class: "mi-item", role: "menuitem", onclick: () => { fecharMenu(); p.abrir(); } }, icone(iconeProg(p), "ico-menu"), h("span", {}, nomeProg(p)))));
  const dir = h("div", { class: "mi-dir" },
    h("div", { class: "mi-sub" }, "Documentos recentes"),
    h("button", { type: "button", class: "mi-item", role: "menuitem", onclick: () => { fecharMenu(); abrirEncerramento(); } }, icone("Arquivo", "ico-menu"), h("span", {}, "Matéria completa")));
  menu.replaceChildren(
    h("div", { class: "mi-topo" }, avatar(S.fotoGrupo, nomeConta(), "avatar-menu"), h("strong", {}, nomeConta())),
    h("div", { class: "mi-corpo" }, esq, dir),
    h("div", { class: "mi-base" },
      h("button", { type: "button", class: "btn-xp", onclick: () => { fecharMenu(); fazerLogoff(); } }, "Fazer logoff"),
      h("button", { type: "button", class: "btn-xp", onclick: () => { fecharMenu(); desligar(); } }, "Desligar")));
}
function alternarMenu() { const m = $("#menu-iniciar"); m.hidden = !m.hidden; $("#btn-iniciar").classList.toggle("aberto", !m.hidden); $("#btn-iniciar").setAttribute("aria-expanded", String(!m.hidden)); if (!m.hidden) { const p = m.querySelector(".mi-item"); if (p) p.focus(); } }
function fecharMenu() { const m = $("#menu-iniciar"); if (m && !m.hidden) { m.hidden = true; $("#btn-iniciar").classList.remove("aberto"); $("#btn-iniciar").setAttribute("aria-expanded", "false"); } }
document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#menu-iniciar, #btn-iniciar")) fecharMenu(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharMenu(); });

/* ----- Pauta (pauta.txt no Bloco de notas) ----- */
function textoPauta() {
  const prox = proximaSugerida();
  const linhas = [{ t: "PAUTA – " + tituloCurto() }, { t: "=".repeat(40) }];
  for (let n = 1; n <= TOTAL; n++) {
    const p = paradaCfg(n);
    const marca = estado.concluidas.has(n) ? "[x]" : n === prox ? "[>]" : "[ ]";
    const nome = n + ". " + p.icone;
    const pontos = ".".repeat(Math.max(3, 20 - nome.length));
    linhas.push({ t: marca + " " + nome + " " + pontos + " " + p.nomeCurto, n });
  }
  linhas.push({ t: "" }, { t: "Progresso: " + estado.concluidas.size + " de " + TOTAL });
  return linhas;
}
function abrirPauta() {
  abrirJanela({ id: "pauta", titulo: "pauta.txt – Bloco de notas", icone: "Pauta", w: 520, h: 400, classe: "j-pauta", montar(j) {
    const doc = h("div", { class: "pauta-doc", tabindex: "0" });
    const desenhar = () => {
      doc.replaceChildren(...textoPauta().map((l) => l.n
        ? h("button", { type: "button", class: "pauta-linha", onclick: () => abrirParada(l.n) }, l.t)
        : h("div", { class: "pauta-texto" }, l.t || "\u00a0")));
    };
    j.api.atualizar = desenhar;
    desenhar();
    j.corpo.append(h("div", { class: "menu-decor", "aria-hidden": "true" }, h("span", {}, "Arquivo"), h("span", {}, "Editar"), h("span", {}, "Formatar"), h("span", {}, "Ajuda")), doc);
  } });
}

/* ----- Modo celular × computador ----- */
function aplicarModo() { document.body.classList.toggle("mobile", ehMobile()); }
window.addEventListener("resize", aplicarModo);
window.addEventListener("orientationchange", aplicarModo);

/* ===== Inicialização, login, logoff ======================================= */
let timerBoot = null;
function mostrarTela(id) {
  ["boot", "login", "desktop"].forEach((t) => { const e = $("#" + t); if (e) e.hidden = t !== id; });
}
function iniciarBoot(texto) {
  const boot = $("#boot");
  const curto = estado.visitou || !!texto;
  const dur = curto ? 1000 : 3000;
  boot.replaceChildren(
    h("div", { class: "boot-centro" },
      logoCtrlz("boot-logo"),
      texto ? h("p", { class: "boot-texto" }, texto) : null,
      h("div", { class: "progresso", role: "progressbar", "aria-label": "Iniciando" }, h("div", { class: "progresso-trilho" }, h("i", { style: { animationDuration: dur + "ms" } })))),
    h("button", { type: "button", class: "btn-pular", onclick: irParaLogin }, "Pular"));
  mostrarTela("boot");
  gravar(); /* marca a visita: a próxima inicialização é mais curta */
  clearTimeout(timerBoot);
  timerBoot = setTimeout(irParaLogin, dur);
}
function irParaLogin() {
  clearTimeout(timerBoot);
  const login = $("#login");
  if (S.fundoLogin) login.style.backgroundImage = "url('" + String(S.fundoLogin).replace(/'/g, "%27") + "')"; else login.style.backgroundImage = "";
  const entrar = () => entrarNoSistema();
  login.replaceChildren(
    h("div", { class: "login-topo" }),
    h("div", { class: "login-meio" },
      h("div", { class: "login-esq" }, logoCtrlz("login-logo"), h("p", {}, "Para começar, clique no seu usuário")),
      h("div", { class: "login-dir" },
        h("button", { type: "button", class: "conta", onclick: entrar },
          avatar(S.fotoGrupo, nomeConta(), "avatar-conta"),
          h("span", { class: "conta-nome" }, nomeConta())))),
    h("div", { class: "login-base" }, h("button", { type: "button", class: "btn-pular claro", onclick: entrar }, "Pular")));
  mostrarTela("login");
  const c = login.querySelector(".conta"); if (c) c.focus();
}
function entrarNoSistema() {
  construirDesktop();
  aplicarModo();
  mostrarTela("desktop");
  atualizarProgressoUI();
  const retorno = estado.concluidas.size > 0;
  const texto = retorno ? rec("retorno") : rec("inicial");
  if (texto) agendarRecado(texto, proximaSugerida() || "encerramento", 1000, true);
  if (CONFERIR) setTimeout(abrirConferencia, 300);
}
function fazerLogoff() { fecharTodas(); cancelarRecados(); fecharNotificacao(); irParaLogin(); }
function desligar() { fecharTodas(); cancelarRecados(); fecharNotificacao(); iniciarBoot("Desligando…"); }
/* Pop-up de confirmação (cobre a tela inteira) */
function confirmarReinicio() {
  if ($("#confirma-reinicio")) return;
  const fecharPopup = () => { popup.remove(); const b = $("#btn-reiniciar"); if (b) b.focus(); };
  const cancelar = h("button", { type: "button", class: "btn-xp", onclick: fecharPopup }, "Cancelar");
  const okay = h("button", { type: "button", class: "btn-xp primario", onclick() { popup.remove(); recomecarVisita(); } }, "Okay");
  const popup = h("div", { id: "confirma-reinicio", class: "confirma", role: "alertdialog", "aria-modal": "true", "aria-label": "Confirmar reinício",
    onkeydown(e) { if (e.key === "Escape") { e.stopPropagation(); fecharPopup(); } } },
    h("div", { class: "confirma-caixa" },
      h("p", {}, "Esta ação apagará seu progresso no site. Deseja continuar?"),
      h("div", { class: "confirma-botoes" }, okay, cancelar)));
  $("#desktop").append(popup);
  cancelar.focus();
}
function recomecarVisita() {
  fecharTodas(); cancelarRecados(); fecharNotificacao();
  estado.concluidas.clear(); estado.recados = [];
  apagarSalvo();
  atualizarProgressoUI();
  irParaLogin();
}

/* ===== 6. Programas ======================================================= */

/* ----- Leitor de Word: usado nas paradas 2 e 9 ----- */
function montarLeitorWord(j, n) {
  const t = blocoTrecho(n);
  j.corpo.append(
    h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Editar", "Exibir", "Inserir", "Formatar", "Ferramentas", "Ajuda"].map((s) => h("span", {}, s))),
    h("div", { class: "word-barra", "aria-hidden": "true" }, h("b", {}, "N"), h("i", {}, "I"), h("u", {}, "S"), h("span", { class: "sep" }), h("span", { class: "alinha" }, "≡"), h("span", { class: "alinha" }, "☰")),
    h("div", { class: "regua", "aria-hidden": "true" }),
    h("div", { class: "word-rolagem" }, h("div", { class: "pagina" }, t.raiz)));
  vigiar(j, t.trecho, t.fim, n);
}

/* ----- 1. Correio ----- */
function abrirCorreio() {
  abrirJanela({ id: "correio", titulo: "Correio – Caixa de entrada", icone: "Correio", w: 840, h: 540, classe: "j-correio", montar(j) {
    const p1 = partesParada1();
    const mobile = ehMobile();
    let pasta = "entrada";
    let aberto = mobile || estado.concluidas.has(1); /* no celular o e-mail já abre direto */
    let lido = aberto;
    const capa = paradaCfg(1).fotoCapa;

    const leitura = h("div", { class: "co-leitura" });
    const listaEl = h("div", { class: "co-lista" });
    const pastasEl = h("nav", { class: "co-pastas", "aria-label": "Pastas" });

    const emailEl = () => {
      const corpo = h("div", { class: "materia", "data-parada": 1 });
      corpo.innerHTML = '<h1 class="titulo-materia">' + mdInline(p1.titulo) + "</h1>" +
        (p1.linhaFina ? '<p class="linha-fina">' + mdInline(p1.linhaFina) + "</p>" : "") + mdParaHtml(p1.corpo);
      return h("article", { class: "email" },
        h("dl", { class: "email-cab" },
          h("dt", {}, "De:"), h("dd", {}, nomeConta()),
          h("dt", {}, "Assunto:"), h("dd", {}, "Pauta: " + p1.titulo)),
        capa ? h("div", { class: "email-capa" }, img(capa, "")) : null,
        corpo,
        h("button", { type: "button", class: "anexo", onclick: () => abrirParada(2) }, icone("Rascunho.doc", "ico-pq"), h("span", {}, "rascunho.doc")),
        rodape(1));
    };
    const abrirEmail = () => { aberto = true; lido = true; concluirParada(1); desenhar(); };
    function desenhar() {
      pastasEl.replaceChildren(
        h("button", { type: "button", class: "co-pasta" + (pasta === "entrada" ? " sel" : ""), onclick() { pasta = "entrada"; desenhar(); } }, "Caixa de entrada", lido ? "" : " (1)"),
        h("button", { type: "button", class: "co-pasta" + (pasta === "enviados" ? " sel" : ""), onclick() { pasta = "enviados"; desenhar(); } }, "Enviados"));
      if (pasta === "enviados") {
        listaEl.replaceChildren(h("p", { class: "co-vazia" }, "Esta pasta está vazia."));
        leitura.replaceChildren();
        return;
      }
      listaEl.replaceChildren(
        h("div", { class: "co-cab-lista" }, h("span", {}, "De"), h("span", {}, "Assunto"), h("span", {}, "Recebido")),
        h("button", { type: "button", class: "co-linha" + (lido ? "" : " nao-lida") + (aberto ? " sel" : ""), onclick: abrirEmail },
          h("span", {}, nomeConta()), h("span", {}, "Pauta: " + p1.titulo), h("span", {}, new Date().toLocaleDateString("pt-BR"))));
      leitura.replaceChildren(aberto ? emailEl() : h("p", { class: "co-dica" }, "Selecione uma mensagem para ler."));
    }
    desenhar();
    if (mobile) concluirParada(1);
    j.corpo.append(
      h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Editar", "Exibir", "Mensagem", "Ajuda"].map((s) => h("span", {}, s))),
      h("div", { class: "co-grade" }, pastasEl, h("div", { class: "co-direita" }, listaEl, leitura)));
  } });
}

/* ----- 2. Rascunho.doc ----- */
function abrirRascunho() {
  abrirJanela({ id: "rascunho", titulo: "rascunho.doc – Documento", icone: "Rascunho.doc", w: 760, h: 560, classe: "j-word", montar: (j) => montarLeitorWord(j, 2) });
}

/* ----- 3. Okrute ----- */
function abrirOkrute() {
  const cfg = R.okrute || {};
  const nome = cfg.nome || "Eu amo analógico";
  abrirJanela({ id: "okrute", titulo: nome + " – Okrute", icone: "Okrute", w: 880, h: 580, classe: "j-okrute", montar(j) {
    const t = blocoTrecho(3);
    const topicos = lista(R.videos).filter((v) => v.categoria === "tutoriais" || v.topicoOkrute);
    const membros = lista(R.pessoas);
    const centro = h("div", { class: "ok-centro" },
      cfg.fotoDestaque ? h("div", { class: "ok-destaque" }, img(cfg.fotoDestaque, cfg.fotoDestaqueDescricao || "")) : null,
      h("h2", { class: "ok-titulo" }, nome),
      t.raiz,
      topicos.length ? h("section", { class: "ok-forum" }, h("h3", {}, "Tópicos do fórum"),
        h("ul", {}, topicos.map((v) => h("li", {}, h("button", { type: "button", class: "ok-topico", onclick: () => abrirVideos(v.id) }, icone("Vídeos", "ico-pq"), v.topicoOkrute || v.titulo))))) : null);
    const lateral = membros.length ? h("aside", { class: "ok-membros" }, h("h3", {}, "Membros (" + membros.length + ")"),
      h("ul", {}, membros.map((p) => h("li", {}, h("button", { type: "button", class: "ok-membro", onclick: () => abrirMSG(p.id) }, avatar(p.foto, p.nome, "avatar-membro"), h("span", {}, p.nome)))))) : null;
    j.corpo.append(
      h("div", { class: "ok-topo" }, h("span", { class: "ok-logo" }, "okrute"), h("span", { class: "ok-sub" }, "comunidades")),
      h("div", { class: "ok-grade" + (lateral ? "" : " sem-lateral") }, centro, lateral));
    vigiar(j, t.trecho, t.fim, 3);
  } });
}

/* ----- Vídeo com legenda (usado pelas Fotos, pelo MSG e pelo programa Vídeos) ----- */
function criarVideo(v) {
  const el = h("video", { controls: true, playsinline: true, preload: "metadata", poster: v.capa || null, src: v.arquivo || null });
  if (v.legendas) el.append(h("track", { kind: "captions", srclang: "pt", label: "Português", src: v.legendas, default: true }));
  return el;
}

/* ----- 4. Fotos da feira ----- */
function abrirFotos() {
  abrirJanela({ id: "fotos", titulo: "Feira do Bixiga", icone: "Fotos da feira", w: 920, h: 580, classe: "j-fotos", montar(j) {
    const t = blocoTrecho(4);
    const painel = h("aside", { class: "fo-painel" }, h("h3", {}, "Sobre esta pasta"), h("div", { class: "fo-texto" }, t.raiz));
    const area = h("div", { class: "fo-area" });
    const fotosDe = (g) => lista(R.fotos).filter((f) => f.arquivo && f.grupo === g && !f.parada);
    const abertura = videoPorId(paradaCfg(4).videoAbertura);
    let pasta = "feira", atual = null;

    const itens = () => (pasta === "feira"
      ? [abertura ? { tipo: "video", v: abertura } : null].concat(fotosDe("feira").map((f) => ({ tipo: "foto", f }))).filter(Boolean)
      : fotosDe("arredores").map((f) => ({ tipo: "foto", f })));
    const irPara = (p) => { pasta = p; atual = null; desenhar(); };

    function visor(its, i) {
      const it = its[i];
      const midia = it.tipo === "video" ? criarVideo(it.v) : img(it.f.arquivo, it.f.descricao, "fo-grande");
      const legenda = it.tipo === "video" ? it.v.titulo : it.f.legenda;
      const credito = it.tipo === "video" ? it.v.credito : it.f.credito;
      const el = h("div", { class: "fo-visor" },
        h("div", { class: "fo-midia" }, midia),
        h("div", { class: "fo-legenda" }, legenda ? h("span", {}, legenda) : null, credito ? h("span", { class: "credito" }, (it.tipo === "video" ? " Crédito: " : " Foto: ") + credito) : null),
        h("div", { class: "fo-nav" },
          h("button", { type: "button", class: "btn-xp", onclick() { atual = null; desenhar(); } }, "Voltar à pasta"),
          h("button", { type: "button", class: "btn-xp", "aria-label": "Anterior", disabled: its.length < 2, onclick() { atual = (i - 1 + its.length) % its.length; desenhar(); } }, "‹"),
          h("span", { class: "fo-pos" }, (i + 1) + " de " + its.length),
          h("button", { type: "button", class: "btn-xp", "aria-label": "Próxima", disabled: its.length < 2, onclick() { atual = (i + 1) % its.length; desenhar(); } }, "›")));
      /* Deslizar o dedo troca de foto */
      let x0 = null;
      el.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" && e.target.tagName !== "VIDEO") x0 = e.clientX; });
      el.addEventListener("pointerup", (e) => {
        if (x0 == null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 50 && its.length > 1) { atual = (i + (dx < 0 ? 1 : -1) + its.length) % its.length; desenhar(); }
      });
      return el;
    }
    function desenhar() {
      const its = itens();
      const caminho = h("div", { class: "fo-caminho" },
        pasta === "arredores" ? h("button", { type: "button", class: "btn-xp", onclick: () => irPara("feira") }, "‹ Feira do Bixiga") : null,
        h("span", {}, pasta === "feira" ? "Feira do Bixiga" : "Feira do Bixiga › Arredores"));
      if (atual != null && its[atual]) { area.replaceChildren(caminho, visor(its, atual)); return; }
      const grade = h("div", { class: "fo-grade" });
      if (pasta === "feira" && fotosDe("arredores").length) {
        grade.append(h("button", { type: "button", class: "fo-item pasta", onclick: () => irPara("arredores") }, icone("Pasta", "ico-fo"), h("span", {}, "Arredores")));
      }
      its.forEach((it, i) => {
        const rotulo = it.tipo === "video" ? it.v.titulo || "Vídeo" : it.f.legenda || it.f.descricao || "Foto";
        const miniatura = it.tipo === "video"
          ? (it.v.capa ? img(it.v.capa, "", "fo-mini") : icone("Vídeos", "ico-fo"))
          : img(it.f.arquivo, "", "fo-mini");
        grade.append(h("button", { type: "button", class: "fo-item", onclick() { atual = i; desenhar(); } }, miniatura, h("span", {}, rotulo)));
      });
      if (!grade.children.length) grade.append(h("p", { class: "fo-vazia" }, "As fotos desta pasta chegam em breve."));
      area.replaceChildren(caminho, grade);
    }
    j.aoVoltar = () => { if (atual != null) { atual = null; desenhar(); return true; } if (pasta === "arredores") { irPara("feira"); return true; } return false; };
    desenhar();
    j.corpo.append(h("div", { class: "fo-grade-janela" }, painel, area));
    vigiar(j, t.trecho, t.fim, 4);
  } });
}

/* ----- 5. MSG ----- */
function contatoDaParada5() {
  const p = lista(R.pessoas).filter((x) => x.parada === 5)[0];
  return p ? p.id : "equipe";
}
function abrirMSG(contato) {
  const ex = janelas.get("msg");
  if (ex) { trazer(ex); if (contato) ex.api.selecionar(contato); return ex; }
  return abrirJanela({ id: "msg", titulo: "MSG", icone: "MSG", w: 840, h: 570, classe: "j-msg", montar(j) {
    let sel = contato || "equipe";
    let vista = ehMobile() && !contato ? "lista" : "conversa";
    let pararConversa = null;
    const raiz = h("div", { class: "msg-grade" });
    const listaEl = h("div", { class: "msg-contatos" });
    const conv = h("div", { class: "msg-conversa" });

    const grupos = () => {
      const ps = lista(R.pessoas);
      return [["Equipe", [{ id: "equipe", nome: "Equipe CTRL+Z", foto: S.fotoGrupo, equipe: true }]],
        ["Personagens", ps.filter((p) => p.tipo !== "especialista")],
        ["Especialistas", ps.filter((p) => p.tipo === "especialista")]].filter((g) => g[1].length);
    };
    function desenharLista() {
      listaEl.replaceChildren(h("div", { class: "msg-eu" }, avatar(S.fotoGrupo, "V", "avatar-eu"), h("span", {}, "Você (visitante)")),
        ...grupos().map(([titulo, itens]) => h("div", { class: "msg-grupo" }, h("h3", {}, titulo),
          itens.map((c) => h("button", { type: "button", class: "msg-contato" + (c.id === sel ? " sel" : ""), onclick: () => selecionar(c.id) },
            avatar(c.foto, c.nome, "avatar-contato" + (c.equipe ? (estado.concluidas.size >= TOTAL ? " online" : " ausente") : "")),
            h("span", { class: "msg-contato-txt" }, h("strong", {}, c.nome), h("small", {}, c.equipe ? statusEquipe() : (c.bio || ""))))))));
    }
    function balao(texto, lado) { return h("div", { class: "bal " + lado, html: mdInline(texto) }); }
    function desenharConversa() {
      if (pararConversa) { pararConversa(); pararConversa = null; }
      const pessoa = sel === "equipe" ? null : pessoaPorId(sel);
      const nome = pessoa ? pessoa.nome : "Equipe CTRL+Z";
      const fluxo = h("div", { class: "msg-fluxo" });
      const temNotas = (pessoa && pessoa.parada === 5) || (!pessoa && contatoDaParada5() === "equipe");
      let notas = null;
      if (temNotas) {
        notas = blocoTrecho(5);
        fluxo.append(h("section", { class: "notas" }, h("h4", {}, "Anotações da entrevista"), notas.raiz));
      }
      if (!pessoa) {
        estado.recados.forEach((r) => fluxo.append(balao(r.texto, "eles")));
      } else {
        if (pessoa.bio) fluxo.append(h("p", { class: "msg-bio" }, pessoa.bio));
        lista(pessoa.falas).forEach((f) => fluxo.append(h("div", { class: "bal eles" }, f)));
        const v = pessoa.video ? videoPorId(pessoa.video) : null;
        if (v) fluxo.append(h("button", { type: "button", class: "btn-xp primario", onclick: () => abrirVideos(v.id) }, "Ver entrevista em vídeo"));
      }
      conv.replaceChildren(
        h("div", { class: "msg-cab" }, avatar(pessoa ? pessoa.foto : S.fotoGrupo, nome, "avatar-cab"),
          h("div", {}, h("strong", {}, nome), h("div", { class: "msg-status" }, pessoa ? (pessoa.tipo === "especialista" ? "Especialista" : "Personagem") : statusEquipe()))),
        fluxo);
      if (notas) pararConversa = vigiar(j, notas.trecho, notas.fim, 5);
      if (!pessoa) fluxo.scrollTop = fluxo.scrollHeight;
    }
    function aplicar() { raiz.dataset.vista = vista; desenharLista(); }
    function selecionar(id) { sel = id; vista = "conversa"; aplicar(); desenharConversa(); }
    j.api.selecionar = selecionar;
    j.api.atualizar = () => { desenharLista(); if (sel === "equipe") { const f = conv.querySelector(".msg-fluxo"); const topo = f ? f.scrollTop : 0; desenharConversa(); if (f) { const nf = conv.querySelector(".msg-fluxo"); if (nf) nf.scrollTop = Math.max(topo, nf.scrollHeight); } } else { const s = conv.querySelector(".msg-status"); if (s && !pessoaPorId(sel)) s.textContent = statusEquipe(); } };
    j.aoVoltar = () => { if (ehMobile() && vista === "conversa") { vista = "lista"; aplicar(); return true; } return false; };
    raiz.append(listaEl, conv);
    j.corpo.append(h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Contatos", "Ações", "Ferramentas", "Ajuda"].map((s) => h("span", {}, s))), raiz);
    aplicar();
    desenharConversa();
  } });
}

/* ----- 6. Pinta ----- */
/** Foto de reserva (ilustração própria) quando nenhuma foto foi configurada. */
function fotoPadrao() {
  try {
    const c = document.createElement("canvas");
    c.width = 800; c.height = 520;
    const g = c.getContext("2d");
    if (!g) return "";
    const ceu = g.createLinearGradient(0, 0, 0, 520);
    ceu.addColorStop(0, "#f6a14b"); ceu.addColorStop(0.55, "#e8625a"); ceu.addColorStop(1, "#5b3a8c");
    g.fillStyle = ceu; g.fillRect(0, 0, 800, 520);
    g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(560, 230, 70, 0, Math.PI * 2); g.fill();
    const cores = ["#3f8fe0", "#6cc04a", "#f2c14e", "#e8472b"];
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 95;
      g.fillStyle = cores[i % 4]; g.fillRect(x, 330, 80, 70);
      g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x - 6, 330); g.lineTo(x + 40, 290); g.lineTo(x + 86, 330); g.closePath(); g.fill();
    }
    g.fillStyle = "#2b2340"; g.fillRect(0, 400, 800, 120);
    return c.toDataURL("image/png");
  } catch (e) { return ""; }
}

function abrirPinta() {
  const cfg = R.pinta || {};
  abrirJanela({ id: "pinta", titulo: "sem título – Pinta", icone: "Pinta", w: 880, h: 620, classe: "j-pinta", montar(j) {
    const L = 800, A = 520;
    const t = blocoTrecho(6);
    let ferramenta = "lapis", cor = "#1b1b1f", tam = 4, pb = false, bloqueado = true;

    /* Quadro: foto, foto em preto e branco (por CSS) e camada de desenho */
    const fotoSrc = cfg.foto || ""; /* sem foto configurada, o quadro fica em branco */
    const imgCor = fotoSrc ? h("img", { class: "pi-foto", alt: cfg.descricao || "Foto para pintar", src: fotoSrc, draggable: "false",
      onerror() { this.remove(); if (imgPb) imgPb.remove(); botaoPb.hidden = true; alca.hidden = true; controle.hidden = true; } }) : null;
    const imgPb = fotoSrc ? h("img", { class: "pi-foto pi-pb", alt: "", "aria-hidden": "true", src: fotoSrc, draggable: "false" }) : null;
    const cv = h("canvas", { class: "pi-desenho", width: L, height: A, "aria-label": "Área de desenho" });
    const g = cv.getContext ? cv.getContext("2d") : null;
    const alca = h("div", { class: "pi-alca", hidden: true, "aria-hidden": "true" }, h("span", {}));
    const quadro = h("div", { class: "pi-quadro" }, imgCor, imgPb, cv, alca);
    const controle = h("input", { type: "range", min: "0", max: "100", value: "50", class: "pi-comparar", "aria-label": "Comparar antes e depois", hidden: true });

    const posicao = (v) => { v = Math.min(100, Math.max(0, v)); if (imgPb) imgPb.style.clipPath = "inset(0 0 0 " + v + "%)"; alca.style.left = v + "%"; controle.value = String(Math.round(v)); };
    controle.addEventListener("input", () => posicao(+controle.value));
    alca.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      try { alca.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      const mover = (ev) => { const r = quadro.getBoundingClientRect(); posicao(((ev.clientX - r.left) / r.width) * 100); };
      const soltar = () => { alca.removeEventListener("pointermove", mover); alca.removeEventListener("pointerup", soltar); alca.removeEventListener("pointercancel", soltar); };
      alca.addEventListener("pointermove", mover); alca.addEventListener("pointerup", soltar); alca.addEventListener("pointercancel", soltar);
    });
    posicao(50);

    /* Desenho */
    let desenhando = false, ult = null;
    const ponto = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) * L) / (r.width || L), y: ((e.clientY - r.top) * A) / (r.height || A) }; };
    const traco = (a, b) => {
      if (!g) return;
      g.globalCompositeOperation = ferramenta === "borracha" ? "destination-out" : "source-over";
      g.strokeStyle = cor; g.fillStyle = cor; g.lineWidth = ferramenta === "borracha" ? tam * 3 : tam; g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x + 0.01, b.y); g.stroke();
    };
    cv.addEventListener("pointerdown", (e) => { if (bloqueado || !g) return; desenhando = true; ult = ponto(e); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } traco(ult, ult); });
    cv.addEventListener("pointermove", (e) => { if (!desenhando) return; const p = ponto(e); traco(ult, p); ult = p; });
    ["pointerup", "pointercancel"].forEach((ev) => cv.addEventListener(ev, () => { desenhando = false; }));

    /* Barra de ferramentas */
    const botoesFerr = {};
    const ferr = (id, rotulo) => { botoesFerr[id] = h("button", { type: "button", class: "btn-xp", "aria-pressed": String(ferramenta === id), onclick() { ferramenta = id; Object.keys(botoesFerr).forEach((k) => botoesFerr[k].setAttribute("aria-pressed", String(k === id))); } }, rotulo); return botoesFerr[id]; };
    const cores = ["#1b1b1f", "#e8472b", "#f2994a", "#f2c14e", "#6cc04a", "#1d9a9a", "#3f8fe0", "#7a4ad8", "#d9558f", "#ffffff"];
    const paleta = h("div", { class: "pi-paleta", role: "group", "aria-label": "Cores" }, cores.map((c) =>
      h("button", { type: "button", class: "pi-cor" + (c === cor ? " sel" : ""), style: { background: c }, "aria-label": "Cor " + c, onclick() { cor = c; ferramenta = "lapis"; Object.keys(botoesFerr).forEach((k) => botoesFerr[k].setAttribute("aria-pressed", String(k === "lapis"))); paleta.querySelectorAll(".pi-cor").forEach((b) => b.classList.toggle("sel", b === this)); } })));
    const espessura = h("select", { "aria-label": "Espessura", onchange() { tam = +this.value; } },
      h("option", { value: "2" }, "Fina"), h("option", { value: "4", selected: true }, "Média"), h("option", { value: "10" }, "Grossa"));
    const botaoPb = h("button", { type: "button", class: "btn-xp primario pi-pb-btn", "aria-pressed": "false", onclick() {
      pb = !pb;
      this.setAttribute("aria-pressed", String(pb));
      if (imgPb) imgPb.classList.toggle("ativo", pb); alca.hidden = !pb; controle.hidden = !pb;
      this.textContent = pb ? "Ver a foto em cores" : "Filtro preto e branco";
    } }, "Filtro preto e branco");
    if (!fotoSrc) botaoPb.hidden = true; /* o filtro só faz sentido com uma foto */
    const barra = h("div", { class: "pi-barra" }, ferr("lapis", "Lápis"), ferr("borracha", "Borracha"), paleta, espessura,
      h("button", { type: "button", class: "btn-xp", onclick() { if (g) g.clearRect(0, 0, L, A); } }, "Limpar"), botaoPb);

    j.corpo.append(h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Editar", "Exibir", "Imagem", "Cores", "Ajuda"].map((s) => h("span", {}, s))),
      barra, h("div", { class: "pi-mesa" }, quadro), controle);

    /* Pop-up "Leia antes de pintar": Fechar só é liberado ao rolar até o fim */
    const fechar = h("button", { type: "button", class: "btn-xp primario", disabled: true, onclick() { popup.remove(); bloqueado = false; if (botaoPb) botaoPb.focus(); } }, "Fechar");
    const texto = h("div", { class: "pi-popup-texto", tabindex: "0" }, t.raiz);
    const liberar = () => { if (texto.scrollTop + texto.clientHeight >= texto.scrollHeight - 6) fechar.disabled = false; };
    texto.addEventListener("scroll", liberar);
    const popup = h("div", { class: "pi-popup", role: "dialog", "aria-modal": "true", "aria-label": rec("pintaPopup") || "Leia antes de pintar" },
      h("div", { class: "pi-popup-caixa" }, h("h3", {}, rec("pintaPopup") || "Leia antes de pintar"), texto, h("div", { class: "pi-popup-botoes" }, fechar)));
    j.corpo.append(popup);
    setTimeout(liberar, 0);
    setTimeout(liberar, 400);
    vigiar(j, t.trecho, t.fim, 6);
  } });
}

/* ----- 7. Toca-discos ----- */
function abrirToca() {
  const cfg = R.toca || {};
  abrirJanela({ id: "toca", titulo: "Toca-discos", icone: "Toca-discos", w: 880, h: 580, classe: "j-toca", montar(j) {
    const t = blocoTrecho(7);
    let tocando = false;
    const artistas = lista(cfg.artistas);
    const disco = h("div", { class: "disco" }, h("div", { class: "rotulo" }, h("span", {}, tituloCurto()), h("small", {}, "Lado A")));
    const prato = h("div", { class: "prato" }, disco, h("div", { class: "braco" }));
    const estadoEl = h("p", { class: "toca-estado", "aria-live": "polite" });
    const btn = h("button", { type: "button", class: "btn-xp primario tocar", "aria-pressed": "false", onclick: alternar }, "Tocar");
    function mensagem() { estadoEl.textContent = tocando ? (estado.som ? "Tocando." : "Tocando. Ligue o som na bandeja para ouvir o chiado.") : ""; }
    function alternar() {
      tocando = !tocando;
      prato.classList.toggle("tocando", tocando);
      btn.textContent = tocando ? "Parar" : "Tocar";
      btn.setAttribute("aria-pressed", String(tocando));
      if (tocando) Som.chiadoIniciar(); else Som.chiadoParar();
      mensagem();
    }
    const aoSom = () => { if (tocando) { if (estado.som) Som.chiadoIniciar(); else Som.chiadoParar(); } mensagem(); };
    ouvintesSom.push(aoSom);
    j.limpezas.push(() => { Som.chiadoParar(); const i = ouvintesSom.indexOf(aoSom); if (i >= 0) ouvintesSom.splice(i, 1); });

    const tutorial = cfg.tutorial ? videoPorId(cfg.tutorial) : null;
    const credito = cfg.chiado ? cfg.chiadoCredito : "Chiado gerado no próprio navegador.";
    const deck = h("div", { class: "toca-deck" }, prato, btn, estadoEl,
      artistas.length ? h("div", { class: "lado-a" }, h("h4", {}, "Lado A"), h("ul", {}, artistas.map((a) => h("li", {}, a)))) : null);
    const t2 = h("div", { class: "encarte" },
      h("h4", { class: "encarte-titulo" }, "Encarte"),
      cfg.capa ? h("div", { class: "encarte-capa" }, img(cfg.capa, cfg.capaDescricao || "")) : null,
      t.raiz,
      tutorial ? h("button", { type: "button", class: "btn-xp", onclick: () => abrirVideos(tutorial.id) }, tutorial.titulo || "Ver tutorial") : null,
      credito ? h("p", { class: "toca-credito" }, credito) : null);
    j.corpo.append(h("div", { class: "toca-grade" }, deck, t2));
    vigiar(j, t.trecho, t.fim, 7);
  } });
}

/* ----- 8. Navegador ----- */
function abrirNavegador() {
  const cfg = R.navegador || {};
  abrirJanela({ id: "navegador", titulo: "Navegador", icone: "Navegador", w: 920, h: 590, classe: "j-nav", montar(j) {
    const secoesCfg = lista(cfg.secoes).length ? cfg.secoes : [{ id: "brain-rot", titulo: "Brain rot" }, { id: "streaming", titulo: "Streaming e vinil" }, { id: "ia", titulo: "Música feita por IA" }];
    const blocos = (trechos[8] || "").split(/\n{2,}/).filter((b) => b.trim());
    /* Divide os parágrafos entre as seções: configurável em paragrafosPorSecao; senão, em partes iguais. */
    let tamanhos = lista(cfg.paragrafosPorSecao);
    if (tamanhos.length !== secoesCfg.length) {
      const base = Math.floor(blocos.length / secoesCfg.length), extra = blocos.length % secoesCfg.length;
      tamanhos = secoesCfg.map((_, i) => base + (i < extra ? 1 : 0));
    }
    let pos = 0;
    const secoes = secoesCfg.map((s, i) => {
      const fatia = i === secoesCfg.length - 1 ? blocos.slice(pos) : blocos.slice(pos, pos + tamanhos[i]);
      pos += tamanhos[i];
      return { id: s.id, titulo: s.titulo, md: fatia.join("\n\n"), links: lista(R.links).filter((l) => l.secao === s.id && urlSegura(l.url)) };
    }).filter((s) => s.md || s.links.length || lista(R.fotos).some((f) => f.parada === 8 && f.secao === s.id));

    const pagina = h("div", { class: "na-pagina" }, h("h2", { class: "na-h" }, "Pesquisa da reportagem"));
    const trechoEl = h("div", { class: "na-trecho", "data-parada": 8 });
    const alvos = {};
    secoes.forEach((s) => {
      const sec = h("section", { class: "na-secao", id: "sec-" + s.id }, h("h3", { class: "na-titulo" }, s.titulo));
      if (s.md) sec.append(h("div", { class: "materia", html: mdParaHtml(s.md) }));
      lista(R.fotos).filter((f) => f.parada === 8 && f.secao === s.id && f.arquivo).forEach((f) => sec.append(figura(f)));
      s.links.forEach((l) => sec.append(h("a", { class: "na-fonte", href: l.url, target: "_blank", rel: "noopener noreferrer" },
        h("span", { class: "na-fonte-rotulo" }, "Ler a fonte original"), h("strong", {}, l.titulo || l.fonte), l.titulo && l.fonte ? h("small", {}, l.fonte) : null)));
      alvos[s.id] = sec;
      trechoEl.append(sec);
    });
    const fim = rodape(8);
    pagina.append(trechoEl, fim);
    const rolagem = h("div", { class: "na-rolagem" }, pagina);

    const irSecao = (id) => { const el = alvos[id]; if (el) el.scrollIntoView({ behavior: reduzMovimento() ? "auto" : "smooth", block: "start" }); lista_.classList.remove("aberta"); };
    const lista_ = h("div", { class: "na-fav-lista" }, secoes.map((s) => h("button", { type: "button", class: "na-fav", onclick: () => irSecao(s.id) }, s.titulo)));
    const toggle = h("button", { type: "button", class: "na-fav-toggle", "aria-expanded": "false", onclick() { const a = lista_.classList.toggle("aberta"); this.setAttribute("aria-expanded", String(a)); } }, "Favoritos ▾");
    j.corpo.append(
      h("div", { class: "na-barra" },
        h("span", { class: "na-nav", "aria-hidden": "true" }, h("i", {}, "‹"), h("i", {}, "›"), h("i", {}, "⟳")),
        h("input", { class: "na-endereco", type: "text", readonly: true, value: cfg.endereco || "ctrlz://pesquisa-da-reportagem", "aria-label": "Endereço" })),
      h("div", { class: "na-favoritos" }, toggle, lista_),
      rolagem);
    vigiar(j, trechoEl, fim, 8);
  } });
}

/* ----- 9. Meu computador (Meus documentos → fechamento.doc) ----- */
function abrirFechamento() {
  abrirJanela({ id: "fechamento", titulo: "fechamento.doc – Documento", icone: "Rascunho.doc", w: 760, h: 560, classe: "j-word", montar: (j) => montarLeitorWord(j, 9) });
}
function abrirComputador() {
  if (ehMobile()) return abrirFechamento(); /* no celular abre direto no documento de fechamento */
  return abrirJanela({ id: "computador", titulo: "Meus documentos", icone: "Meu computador", w: 720, h: 460, classe: "j-computador", montar(j) {
    const abrir = () => abrirFechamento();
    j.corpo.append(
      h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Editar", "Exibir", "Favoritos", "Ferramentas", "Ajuda"].map((s) => h("span", {}, s))),
      h("div", { class: "mc-endereco" }, h("span", {}, "Endereço:"), h("span", { class: "mc-caminho" }, "Meus documentos")),
      h("div", { class: "mc-grade" },
        h("aside", { class: "mc-lateral" }, h("h3", {}, "Tarefas"), h("button", { type: "button", class: "mc-tarefa", onclick: abrir }, "Abrir fechamento.doc")),
        h("div", { class: "mc-arquivos" },
          h("button", { type: "button", class: "mc-arquivo destaque", onclick: abrir }, icone("Rascunho.doc", "grande"), h("span", {}, "fechamento.doc")))));
    const b = j.corpo.querySelector(".mc-arquivo"); if (b) setTimeout(() => b.focus(), 50);
  } });
}

/* ----- Vídeos (fora do roteiro; não conta no progresso nem recebe brilho) ----- */
function abrirVideos(id) {
  const ex = janelas.get("videos");
  if (ex) { trazer(ex); if (id) ex.api.tocar(id); return ex; }
  return abrirJanela({ id: "videos", titulo: nomeVideosPrograma(), icone: "Vídeos", w: 880, h: 580, classe: "j-videos", montar(j) {
    const cats = [["entrevistas", "Entrevistas"], ["feira", "A feira"], ["tutoriais", "Tutoriais"]];
    const todos = lista(R.videos);
    const tela = h("div", { class: "vd-tela" });
    const info = h("div", { class: "vd-info" });
    const itensEl = h("div", { class: "vd-lista" });
    let atual = null;
    function tocar(vid) {
      const v = videoPorId(vid);
      if (!v) return;
      atual = v.id;
      let player;
      if (v.arquivo) {
        player = criarVideo(v);
        player.addEventListener("error", () => { tela.append(h("p", { class: "vd-erro" }, "Não foi possível carregar este vídeo.")); });
      } else player = h("p", { class: "vd-dica" }, "Este vídeo ainda não está disponível.");
      tela.replaceChildren(player);
      info.replaceChildren(h("strong", {}, v.titulo || ""), v.credito ? h("span", { class: "credito" }, " Crédito: " + v.credito) : null);
      itensEl.querySelectorAll(".vd-item").forEach((b) => b.classList.toggle("sel", b.dataset.id === atual));
    }
    j.api.tocar = tocar;
    cats.forEach(([chave, nome]) => {
      const vs = todos.filter((v) => v.categoria === chave);
      if (!vs.length) return;
      itensEl.append(h("h3", {}, nome), ...vs.map((v) => h("button", { type: "button", class: "vd-item", "data-id": v.id, onclick: () => tocar(v.id) }, v.capa ? img(v.capa, "") : icone("Vídeos", "ico-pq"), h("span", {}, v.titulo || v.id))));
    });
    if (!itensEl.children.length) itensEl.append(h("p", { class: "vd-dica" }, "Ainda não há vídeos por aqui."));
    tela.append(h("p", { class: "vd-dica" }, "Escolha um vídeo da lista."));
    j.corpo.append(h("div", { class: "menu-decor", "aria-hidden": "true" }, ["Arquivo", "Exibir", "Reproduzir", "Ajuda"].map((s) => h("span", {}, s))),
      h("div", { class: "vd-grade" }, h("div", { class: "vd-player" }, tela, info), itensEl));
    if (id) tocar(id);
  } });
}

/* ===== 7. Encerramento, conferência e partida ============================ */
function abrirEncerramento() {
  abrirJanela({ id: "encerramento", titulo: "Matéria completa.doc", icone: "Arquivo", w: 920, h: 640, classe: "j-encerramento", montar(j) {
    const p1 = partesParada1();
    const resto = [];
    if (p1.corpo) resto.push(p1.corpo);
    for (let n = 2; n <= TOTAL; n++) if (trechos[n]) resto.push(trechos[n]);
    const doc = h("article", { class: "materia materia-completa" });
    doc.innerHTML = '<h1 class="titulo-materia">' + mdInline(p1.titulo) + "</h1>" +
      (p1.linhaFina ? '<p class="linha-fina">' + mdInline(p1.linhaFina) + "</p>" : "") + mdParaHtml(resto.join("\n\n"));
    const capa = paradaCfg(1).fotoCapa;
    const principais = lista(R.fotos).filter((f) => f.principal && f.arquivo);

    const equipe = lista(R.equipe);
    const creditos = h("section", { class: "creditos" },
      h("h3", {}, "Créditos"),
      S.fotoGrupo ? h("div", { class: "creditos-foto" }, img(S.fotoGrupo, S.fotoGrupoDescricao || "Foto de grupo da equipe CTRL+Z")) : null,
      equipe.length ? h("ul", { class: "creditos-lista" }, equipe.map((m) => {
        const u = String(m.instagram || "").trim().replace(/^@/, "").replace(/[^\w.]/g, "");
        return h("li", {}, h("span", { class: "creditos-nome" }, m.nome),
          u ? h("a", { href: "https://www.instagram.com/" + u + "/", target: "_blank", rel: "noopener noreferrer" }, "@" + u) : null);
      })) : null);


    j.corpo.append(
      h("div", { class: "word-rolagem" }, h("div", { class: "pagina pagina-larga" },
        capa ? h("div", { class: "email-capa" }, img(capa, "")) : null,
        doc,
        principais.map(figura),
        creditos)));
  } });
}

/* ----- Modo de conferência (?conferir) ----- */
function pendencias() {
  const p = avisosMateria.slice();
  if (!MIDIAS) p.push("A lista de arquivos das pastas não está disponível: rode node atualizar-conteudo.js.");
  else caminhosDeclarados.forEach((c) => { if (MIDIAS.indexOf(c) < 0) p.push("Arquivo não encontrado: " + c); });
  if (!S.fotoGrupo) p.push("Foto de grupo da equipe não definida (site.fotoGrupo).");
  lista(R.equipe).forEach((m) => { if (!m.instagram) p.push("Integrante sem Instagram: " + m.nome); });
  lista(R.fotos).forEach((f) => { if (f.arquivo && !f.descricao) p.push("Foto sem descrição (texto alternativo): " + f.arquivo.replace(/^conteudo\//, "")); });
  lista(R.videos).forEach((v) => { if (!v.arquivo) p.push("Vídeo sem arquivo: " + (v.id || v.titulo)); });
  lista(R.links).forEach((l) => { if (!urlSegura(l.url)) p.push("Link vazio ou inválido: " + (l.fonte || "") + " (seção " + l.secao + ")"); });
  lista(R.pessoas).forEach((x) => {
    if (!x.foto) p.push("Pessoa sem foto: " + x.nome);
    if (x.video && !videoPorId(x.video)) p.push("Vídeo da pessoa " + x.nome + " não está declarado em videos: " + x.video);
  });
  return p;
}
function abrirConferencia() {
  abrirJanela({ id: "conferencia", titulo: "Conferência de conteúdo", icone: "Arquivo", w: 640, h: 460, classe: "j-conferencia", montar(j) {
    const ps = pendencias();
    j.corpo.append(h("div", { class: "conf" },
      h("h3", {}, ps.length ? ps.length + (ps.length === 1 ? " pendência" : " pendências") : "Nenhuma pendência"),
      ps.length ? h("ul", {}, ps.map((x) => h("li", {}, x))) : h("p", {}, "Todo o conteúdo declarado está no lugar.")));
  } });
  console.info("[CTRL+Z] Conferência: " + pendencias().length + " pendência(s).");
}

/* ----- Partida ----- */
function partir() {
  document.title = S.tituloAba || "Do clique ao vinil – CTRL+Z";
  aplicarModo();
  iniciarBoot();
}
/* Pequena interface para testes e depuração */
window.CTRLZ = { estado, concluirParada, abrirParada, proximaSugerida, pendencias, janelas };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", partir); else partir();

})();
