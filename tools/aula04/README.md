# Produção da Aula 04

As fontes desta pasta geram a apresentação e a atividade sem alterar o código do projeto dos alunos.

```text
python tools/aula04/build.py
```

Requer Python 3 e o arquivo lessons/Aula_03_Web_v4.html já existente. A biblioteca Vue 3.5.13 e seu aviso MIT são reaproveitados desse arquivo, sem CDN, download ou alteração da baseline do projeto.

- spec.json: regras, rubrica, seletores e 16 cenários da Missão 04.
- example.json: lógica e template do exemplo da biblioteca, não a solução da avaliação.
- slides.py, deck.html e deck.js: conteúdo, apresentação e execução das demos.
- activity.html e activity.js: página da atividade, ficha local e exportações.
- build.py: geração determinística dos HTMLs, missão, manifesto e instalador; patch idempotente do portal.

Se modificar arquivos em course/, incremente a versão em spec.json e gere novamente. O manifesto rejeita a reutilização da mesma versão com hashes diferentes. Não publique soluções docentes em tools/, course/ ou qualquer outra pasta pública.

O workflow de publicação materializa o pacote de fontes somente na primeira execução, se build.py ainda não existir. Depois, as fontes legíveis deste diretório são a referência. Para alterações posteriores use o workflow manual e confira o diff gerado. Uma publicação feita com GITHUB_TOKEN pode precisar de um commit humano posterior para disparar o Pages configurado por branch.
