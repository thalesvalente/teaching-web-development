# Preparação docente — checker da Missão 04

O aluno não deve instalar ferramentas globais ou trocar as dependências do projeto durante a aula. Prepare uma estação primeiro, valide e replique a configuração autorizada pelo laboratório.

## O que está separado

O projeto Vue conserva seu package.json e package-lock.json. O checker e os textos da missão ficam em course/. Resultados ficam em docs/entregas/missao-04/. A automação Playwright é uma ferramenta do ambiente, não uma dependência nova imposta ao aplicativo.

O pacote inclui somente a Missão 04. Faça o diagnóstico da Aula 3 por observação; não anuncie um checker 03 inexistente.

## Preparar a automação no perfil do usuário

Com Node/npm já validados, execute uma vez no PowerShell:

```powershell
npm install --prefix "$HOME/.ifma-web-tools" --no-audit --no-fund --ignore-scripts playwright-core@1.56.1
```

Essa instalação é separada do projeto dos alunos. Ela não baixa outro navegador. O checker tenta Edge, Chrome e Chromium já instalados. Políticas corporativas podem impedir a abertura automatizada; nesse caso registre NÃO VERIFICADO e use a ficha de testes manuais.

Para uma instalação de ferramenta em outro local, configure o caminho do módulo preparado:

```powershell
$env:IFMA_PLAYWRIGHT_MODULE="C:/caminho/da/ferramenta/node_modules/playwright-core/index.mjs"
```

Somente quando necessário, indique um navegador aprovado pelo laboratório:

```powershell
$env:IFMA_BROWSER_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

Não copie caminhos de exemplo sem verificar que o arquivo existe no computador.

## Validar a estação

Use uma implementação docente ou o projeto do próprio estudante autorizado. Os testes vão preencher entradas sintéticas e recarregar a página: não apontar para um aplicativo com trabalho não salvo.

1. Execute `npm ci` na pasta do projeto, sem mudar a baseline se houver falha.
2. Mantenha `npm run dev` no primeiro terminal.
3. No segundo, rode `node course/runner.mjs check 04`.
4. Leia cada resultado e o JSON em docs/entregas/missao-04/.
5. Faça também revisão de componente, foco, contraste e explicação.

O checker limita navegação/subrecursos a localhost. O app da Aula 4 não depende de API externa. T16 usa o binário local do Vite e um diretório de build temporário: não altera os fontes ou o lockfile.

## Interpretação dos resultados

- `PASS`: aquele comportamento foi executado e observado. Não equivale a nota.
- `FAIL`: o cenário executado não atendeu ao esperado.
- `NOT_VERIFIED`: não foi possível executar (ambiente, servidor ou contrato de seletores ausente). Revise a causa; não invente aprovação.
- Resultado `PARTIAL`: existe pelo menos um item não verificado e nenhum teste executado falhou.

Código de saída: 0 para PASS técnico, 1 para FAIL, 2 para PARTIAL/impedimento. O relatório não atribui nota oficial (`officialGrade: null`).

O checker observa o efeito da comunicação ao App pelo resumo; não intercepta rede nem garante sozinho arquitetura, autoria ou semântica de todos os eventos. Data-testid é só localização neutra do elemento.

## Atualização e recuperação

O instalador e o update validam a origem oficial do upstream, a identidade/versão do manifesto e hashes SHA-256 com normalização de CRLF para LF. Os hashes detectam divergências; não são assinatura independente da conta do professor.

A troca de course/ usa preparação temporária e backup com recuperação em caso de falha. Os registros ficam em `.git/ifma-course/`. Código do aluno, dependências e remotes não são alterados. Não edite course/ para vencer testes: se o manifesto acusar alteração, revise com o professor.

Alterações externas simultâneas são detectadas por hashes dos arquivos protegidos. Um update não substitui backup ou commit do trabalho. Não mantenha um editor salvando course/ durante a atualização.

## Limites operacionais

A correção desta aula não muda as versões prescritas no plano ou no repositório. Uma versão prescrita que não possa ser instalada no laboratório precisa de decisão docente explícita, não de migração silenciosa para latest. O PDF/JSON da ficha não executa o checker nem envia dados ao professor.

Referências: [Playwright — navegadores](https://playwright.dev/docs/browsers), [Git — fetch](https://git-scm.com/docs/git-fetch).
