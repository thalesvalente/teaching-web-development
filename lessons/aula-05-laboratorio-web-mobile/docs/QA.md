# Plano e evidências de QA da Aula 05

A aprovação requer: compilação do TSX com Babel Standalone; execução real do componente React Native Web em **dois** contêineres; sem rede/CDN no navegador; viewport 360/390/768/1280/1600; interação de campo, erro, sucesso, contagem independente; edição de `MINIMO_CARACTERES` e `TEXTO_BOTAO`; regressão de XP ao mudar código; exportação JSON com pendências; navegação por teclado; ausência de `allow-same-origin`; verificação de HTML e links no Pages.

Os testes automatizados de Playwright estão em `tests/lab.spec.mjs` e os estruturais em `tests/source.test.mjs`. Não declarar suporte Android/iOS nativo sem teste no Expo do laboratório. Se algum teste de ambiente falhar, o item continua **NÃO VERIFICADO**. A validação WCAG 2.2 AA precisa de auditoria assistiva manual adicional (VoiceOver/TalkBack, zoom, foco e contraste). Não confundir ausência de overflow com certificação de acessibilidade.
