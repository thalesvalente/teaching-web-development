# Verificação da Aula 04 Web — versão 1.0.0

Data da verificação local: 07/10/2026. Este registro distingue testes executados de condições ainda não verificadas. Não é nota de estudante.

## Resultados executados

| Parte | Execução | Resultado |
|---|---|---|
| Apresentação | 28 slides; 153 estados renderizados em 1280×720, 1366×768 e 1920×1080, incluindo erro/sucesso, respostas e bugs | Nenhum overflow detectado nos estados testados; nenhum erro JavaScript observado |
| Demos | Digitação, submissão por clique/Enter, textarea, campos inválidos, correção, limpeza, comunicação e reset isolado | Passaram os cenários executados |
| Checker | Casos T01–T15 sobre duas implementações docentes equivalentes, com estruturas e textos diferentes | 15/15 em cada implementação |
| Controle negativo | Três implementações defeituosas: vínculo do campo ausente, normalização ausente e emissão antecipada | As três foram rejeitadas pelo checker |
| Atualização seletiva | 15 testes locais de instalação, integridade, bloqueios, preservação e recuperação | 15/15 |
| Ficha | 16 cenários inicialmente não executados; JSON, reimportação, Markdown, PDF A4, importação inválida e conteúdo HTML escapado | Passaram os cenários executados |
| Responsividade da atividade | 360, 390 e 1366 px | Sem overflow horizontal detectado |
| PDF | Documento vazio, preenchimento ilustrativo e texto longo | Paginação A4, texto final preservado e inspeção visual realizadas |

## Ambiente e limites

Os testes de interface usaram Chromium 144.0.7559.96, Vue 3.5.13 embarcado e Playwright disponível no ambiente. As páginas foram carregadas em memória com setContent: isso executa Vue, DOM e eventos reais, mas não valida transporte HTTP, Vite, políticas de Windows ou rede do laboratório.

O Node disponível era 22.16.0, não a versão fixada para a turma. Não foram instaladas nem substituídas dependências do projeto. A configuração completa com o package-lock.json da disciplina e o teste T16 (build do aplicativo com essa baseline) **não foram verificados** neste ambiente. A documentação de preparação orienta a validação em uma estação antes da aula.

Os testes do atualizador usaram repositórios Git temporários e pacotes locais. O fetch do GitHub pela rede do laboratório **não foi executado**. O instalador interrompe com mensagem de erro quando a busca ou a validação não é possível; não faz pull, merge, commit ou push automaticamente.

Os testes docentes não equivalem a aprovação do código de qualquer estudante. Arquitetura, autoria, explicação, contraste, foco e adequação ao contexto ainda exigem revisão humana.

## Critério para aplicação no laboratório

Preparar uma estação, executar o projeto existente, verificar T01–T16 e confirmar o fetch/instalação inicial usando os remotes corretos. Impedimento de ambiente deve permanecer como NÃO VERIFICADO. A ficha manual permite registrar observações mesmo sem automação.

## Materiais preservados

A publicação da aula não modifica src/, package.json ou package-lock.json do projeto-base. O exemplo completo da biblioteca é material didático público; a solução da avaliação, as variações docentes e o gabarito de implementação ficam fora do repositório público.
