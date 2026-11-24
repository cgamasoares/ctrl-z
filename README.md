# PC da Redação CTRL+Z

Site da grande reportagem **"Do clique ao vinil: o analógico conquista espaço entre os jovens"**. É um site estático (HTML, CSS e JavaScript puros, sem framework e sem build), pensado para abrir com dois cliques no `index.html` e para ser hospedado no GitHub Pages.

## Sumário

1. [Estrutura do projeto](#1-estrutura-do-projeto)
2. [Como editar o conteúdo](#2-como-editar-o-conteúdo)
3. [Testar no seu computador](#3-testar-no-seu-computador)
4. [Publicar no GitHub Pages](#4-publicar-no-github-pages)
5. [Atualizar o site depois de publicado](#5-atualizar-o-site-depois-de-publicado)
6. [Domínio próprio (opcional)](#6-domínio-próprio-opcional)
7. [Limites e cuidados](#7-limites-e-cuidados)
8. [Solução de problemas](#8-solução-de-problemas)
9. [Checklist antes de divulgar](#9-checklist-antes-de-divulgar)

---

## 1. Estrutura do projeto

```
index.html                 página principal
404.html                   página de erro do GitHub Pages
package.json               atalhos de comando (npm run atualizar)
atualizar-conteudo.js      empacota o texto e o roteiro em conteudo/_gerado.js
.nojekyll                  impede o GitHub de ignorar arquivos com "_" no nome
.gitignore, .gitattributes configuração do Git
.github/workflows/pages.yml  publicação automática (GitHub Actions)
assets/
  app.js                   janelas, programas e lógica de progresso
  estilo.css               visual, regras de celular e estilos de citação
  marked.min.js            conversor de Markdown (local, sem internet)
  favicon.svg              ícone da aba
conteudo/
  materia.md               texto da reportagem, com os 9 marcadores de parada
  roteiro.js               nomes, pessoas, fotos, vídeos, links e recados
  _gerado.js               GERADO pelo script; nunca edite à mão
  midias/                  fotos, vídeos, capas e legendas
```

## 2. Como editar o conteúdo

Nada é editado no código. Tudo entra por dois arquivos e pelas pastas de mídia.

**Texto da reportagem.** Edite `conteudo/materia.md`. Mantenha os 9 marcadores `<!-- parada: N -->`, cada um sozinho numa linha, de 1 a 9 em ordem. O site nunca altera uma palavra do texto. Para uma citação em destaque, comece o parágrafo com `[destaque] ` (ou `[jornal] `).

**Fotos, vídeos, pessoas, links e recados.** Edite `conteudo/roteiro.js` (há comentários em cada campo) e coloque os arquivos em `conteudo/midias/`. Nos caminhos, escreva `midias/...`, sem `conteudo/` na frente. Campo vazio ou arquivo ausente simplesmente não aparece.

**Depois de qualquer edição**, rode no terminal, dentro da pasta do site:

```
node atualizar-conteudo.js
```

(ou `npm run atualizar`). Esse comando recria o `conteudo/_gerado.js` e avisa sobre marcadores ausentes e mídias não declaradas. Abra o site com `?conferir` no final do endereço para ver a lista de pendências.

Recomendações de mídia: fotos em JPG com até 1600 px e cerca de 300 KB; vídeos em MP4 (H.264 + AAC) até 720p; nomes de arquivo em minúsculas, sem acento nem espaço.

## 3. Testar no seu computador

- **Jeito simples:** dois cliques no `index.html`. Funciona sem servidor.
- **Com servidor local** (mais parecido com o GitHub Pages): na pasta do site, rode `npm run servir` e abra o endereço mostrado, ou `python3 -m http.server 8000` e abra `http://localhost:8000`.

## 4. Publicar no GitHub Pages

O Pages gratuito exige repositório **público**. Há dois jeitos de publicar. O **Jeito A** é o recomendado, porque o próprio GitHub regenera o conteúdo a cada envio.

### Passo 1. Criar o repositório

1. Entre em [github.com](https://github.com) e clique em **New repository**.
2. Dê um nome sem espaço nem acento, por exemplo `do-clique-ao-vinil`.
3. Marque **Public**.
4. Não marque a criação de README, `.gitignore` nem licença (o projeto já tem esses arquivos).
5. Clique em **Create repository**.

### Passo 2. Enviar os arquivos

**Pelo terminal** (dentro da pasta do site):

```
git init
git add -A
git commit -m "Site da reportagem"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/do-clique-ao-vinil.git
git push -u origin main
```

**Pelo navegador, sem Git:** na página do repositório vazio, clique em **uploading an existing file** e arraste todo o conteúdo da pasta, incluindo as pastas ocultas `.github` (e o arquivo `.nojekyll`). Se o navegador não aceitar pastas ocultas, use **Add file → Create new file** e digite o caminho completo `.github/workflows/pages.yml` como nome, colando o conteúdo do arquivo. Clique em **Commit changes**.

> Dica: o limite de envio pelo navegador é de 25 MB por arquivo e cerca de 100 arquivos por vez. Como o site tem fotos e vídeos, o terminal é mais confiável. Hoje nenhum arquivo passa de 25 MB.

### Passo 3A (recomendado). Publicar com GitHub Actions

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Vá na aba **Actions**. O fluxo "Publicar no GitHub Pages" roda sozinho a cada envio para `main`. Se não rodou, abra-o e clique em **Run workflow**.
4. Quando ficar verde (cerca de 1 a 2 minutos), o endereço aparece em **Settings → Pages** e no resumo do fluxo:
   `https://SEU-USUARIO.github.io/do-clique-ao-vinil/`

O fluxo tem dois jobs: **montar** (roda `node atualizar-conteudo.js` e prepara a pasta) e **publicar** (envia ao Pages). Ele publica só o que o site usa (`index.html`, `404.html`, `assets/` e `conteudo/`). README, scripts e arquivos de configuração não vão para o ar.

### Passo 3B (alternativa). Publicar direto da branch

Use este jeito se não quiser usar Actions. Nesse caso, **apague** `.github/workflows/pages.yml`, para não ficar um fluxo que falha.

1. Rode `node atualizar-conteudo.js` e envie o `conteudo/_gerado.js` atualizado junto.
2. Em **Settings → Pages → Source**, escolha **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/ (root)`, e clique em **Save**.
4. Aguarde 1 a 2 minutos. O arquivo `.nojekyll` é obrigatório aqui: sem ele, o GitHub ignora `conteudo/_gerado.js` e o site abre em branco.

## 5. Atualizar o site depois de publicado

1. Edite `materia.md`, `roteiro.js` ou as mídias.
2. Rode `node atualizar-conteudo.js` (obrigatório no Passo 3B; recomendado no 3A, para testar localmente).
3. Envie:

```
git add -A
git commit -m "Atualiza conteúdo"
git push
```

Com o Passo 3A, o site é atualizado em cerca de 1 a 2 minutos. Se continuar vendo a versão antiga, recarregue ignorando o cache (**Ctrl+Shift+R**, ou **Cmd+Shift+R** no Mac).

## 6. Domínio próprio (opcional)

1. Em **Settings → Pages → Custom domain**, digite o domínio (por exemplo `reportagem.seudominio.com.br`) e salve.
2. No provedor do domínio, crie um registro **CNAME** apontando `reportagem` para `SEU-USUARIO.github.io`. Para domínio raiz, use os registros **A** indicados na [documentação do GitHub](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).
3. Marque **Enforce HTTPS** quando a opção ficar disponível.

Com o Passo 3B, o GitHub cria sozinho um arquivo `CNAME` na raiz. Com o 3A, não é preciso criá-lo.

## 7. Limites e cuidados

- **Tamanho:** o GitHub recusa arquivos acima de **100 MB** e recomenda repositórios abaixo de **1 GB**. O site publicado deve ficar abaixo de 1 GB, e o tráfego tem um limite flexível de 100 GB por mês.
- **Vídeos grandes:** acima de 50 MB, prefira hospedar o `.mp4` em outro serviço e colocar a URL no campo `arquivo` do vídeo, em `roteiro.js`. Não use Git LFS: o Pages não serve arquivos do LFS.
- **Maiúsculas e minúsculas:** o servidor diferencia as duas. `Foto.JPG` e `foto.jpg` são arquivos diferentes. Use sempre minúsculas e confira se o nome no `roteiro.js` é idêntico ao do arquivo.
- **Privacidade das fotos:** as fotos publicadas no repositório ficam públicas, mesmo que você as retire depois (o histórico do Git guarda a versão anterior). Remova os dados EXIF (localização) antes de enviar e confirme as autorizações de imagem.
- **Autorização de menores:** a documentação exige a autorização dos responsáveis pelo Raul antes da publicação.
- **Repositório privado:** o Pages só funciona em repositório privado nos planos pagos do GitHub.

## 8. Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Tela em branco | `conteudo/_gerado.js` ausente ou ignorado | No 3B, confirme que `.nojekyll` foi enviado e que rodou `node atualizar-conteudo.js`. Abra o console (F12) e procure erro 404. |
| Mensagem "Conteúdo não encontrado" | `_gerado.js` não foi gerado | Rode `node atualizar-conteudo.js` e envie o arquivo. |
| Página 404 do GitHub | Pages ainda não ativado ou publicação em andamento | Confira **Settings → Pages** e a aba **Actions**. Aguarde 2 minutos. |
| Fluxo em Actions falha em "Publicar" | Source não está em **GitHub Actions** | Ajuste em **Settings → Pages → Source**. |
| Erro "Found 0 artifact(s)" / "No artifacts named github-pages were found" em "Publicar" | O passo não conseguiu ler o artefato (falta de permissão `actions: read`, comum em repositório privado ou de organização) ou o envio anterior falhou | Confirme que o `pages.yml` tem `actions: read` em `permissions`. Abra o job "montar" e veja se "Enviar o artefato" ficou verde. Depois clique em **Re-run all jobs** (e não só "failed jobs"). Em **Settings → Actions → General → Workflow permissions**, escolha "Read and write permissions" se for repositório de organização. |
| Aviso `DEP0040 punycode` no log | Aviso do Node, sem efeito | Pode ignorar: não é a causa de falha. |
| Foto ou vídeo não aparece | Nome ou caminho diferente do arquivo, ou maiúscula | Abra o site com `?conferir`: ele lista "Arquivo não encontrado". |
| Versão antiga aparece | Cache do navegador | Recarregue com **Ctrl+Shift+R**. |
| `git push` recusado por tamanho | Arquivo acima de 100 MB | Comprima o vídeo ou hospede fora. |
| `node` não é reconhecido | Node.js não instalado | Instale a versão LTS em [nodejs.org](https://nodejs.org). |

## 9. Checklist antes de divulgar

- [ ] `materia.md` com o texto final e os 9 marcadores (sem Lorem Ipsum).
- [ ] `node atualizar-conteudo.js` rodou sem avisos.
- [ ] `?conferir` sem pendências: Instagram da equipe, links do g1 e da SubmitHub, fotos com descrição.
- [ ] Foto de grupo da equipe (`site.fotoGrupo`) trocada pela real.
- [ ] Créditos e legendas das fotos e vídeos revisados.
- [ ] Autorização dos responsáveis pelo Raul confirmada.
- [ ] Testado no computador e no celular (390×844 em pé e deitado, 360×800 e 768×1024), com toque e com teclado.
- [ ] Endereço público aberto em janela anônima para conferir.
