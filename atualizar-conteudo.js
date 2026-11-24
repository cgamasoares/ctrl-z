#!/usr/bin/env node
/* ==========================================================================
   atualizar-conteudo.js
   Empacota conteudo/materia.md e conteudo/roteiro.js em conteudo/_gerado.js.
   Assim o site abre com dois cliques no index.html (sem servidor) e também
   funciona hospedado. Também confere o materia.md e lista mídias que estão
   nas pastas mas não foram declaradas em roteiro.js.

   Uso:  node atualizar-conteudo.js
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const pasta = path.join(__dirname, "conteudo");
const arqMateria = path.join(pasta, "materia.md");
const arqRoteiro = path.join(pasta, "roteiro.js");
const arqSaida = path.join(pasta, "_gerado.js");

function ler(arq) {
  if (!fs.existsSync(arq)) { console.error("Arquivo não encontrado: " + arq); process.exit(1); }
  return fs.readFileSync(arq, "utf8");
}
const materia = ler(arqMateria).replace(/\r\n?/g, "\n");
const roteiroTexto = ler(arqRoteiro);

/* 1) Confere os marcadores da matéria */
const avisos = [];
const marcas = [...materia.matchAll(/^<!--\s*parada:\s*(\d+)\s*-->[ \t]*$/gm)].map((m) => +m[1]);
for (let n = 1; n <= 9; n++) if (!marcas.includes(n)) avisos.push("Falta o marcador da parada " + n + ".");
marcas.forEach((n, i) => { if (n !== i + 1) avisos.push("Marcador fora de ordem: parada " + n + " na posição " + (i + 1) + "."); });
if (/\[Cole aqui|lorem ipsum/i.test(materia)) avisos.push("O materia.md ainda tem texto provisório (Lorem ipsum ou [Cole aqui ...]).");

/* 2) Lê o roteiro e junta as mídias declaradas */
const ctx = { window: {} };
try { vm.runInNewContext(roteiroTexto, ctx, { filename: "roteiro.js" }); }
catch (e) { console.error("Erro em roteiro.js: " + e.message); process.exit(1); }
const declaradas = new Set();
(function visitar(o) {
  if (typeof o === "string") { if (/^midias\//.test(o)) declaradas.add(o); }
  else if (o && typeof o === "object") Object.keys(o).forEach((k) => visitar(o[k]));
})(ctx.window.ROTEIRO || {});

/* 3) Lista os arquivos das pastas de mídia */
const naPasta = [];
(function andar(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const cheio = path.join(dir, e.name);
    if (e.isDirectory()) andar(cheio);
    else if (e.name !== ".gitkeep" && !e.name.startsWith(".")) naPasta.push(path.relative(pasta, cheio).split(path.sep).join("/"));
  });
})(path.join(pasta, "midias"));
naPasta.sort();

/* 4) Escreve conteudo/_gerado.js */
const saida =
  "/* ARQUIVO GERADO por atualizar-conteudo.js. Não edite: mude materia.md ou roteiro.js e rode o script de novo. */\n" +
  "window.MATERIA_MD = " + JSON.stringify(materia) + ";\n" +
  "window.MIDIAS_NA_PASTA = " + JSON.stringify(naPasta) + ";\n\n" +
  "/* ---- roteiro.js ---- */\n" + roteiroTexto + "\n";
fs.writeFileSync(arqSaida, saida, "utf8");

console.log("conteudo/_gerado.js atualizado (" + marcas.length + " marcadores, " + naPasta.length + " arquivos de mídia).");
avisos.forEach((a) => console.warn("Aviso: " + a));
const semUso = naPasta.filter((f) => !declaradas.has(f));
if (semUso.length) {
  console.warn("\nArquivos nas pastas que não aparecem em roteiro.js:");
  semUso.forEach((f) => console.warn("  - " + f));
}
const faltando = [...declaradas].filter((f) => !naPasta.includes(f));
if (faltando.length) {
  console.warn("\nArquivos declarados em roteiro.js que não existem nas pastas:");
  faltando.forEach((f) => console.warn("  - " + f));
}
