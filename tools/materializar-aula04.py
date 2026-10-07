#!/usr/bin/env python3
"""Materializa uma vez fontes publicas geradas; nunca instala codigo em src/."""
from pathlib import Path, PurePosixPath
import base64
import hashlib
import json
import lzma

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = '1a19afbc944439c2a66972481600955ce326236af2543aeb0e7f4581430eab70'
ALLOWED = {
    'docs/PREPARAR_VERIFICADOR.md',
    'docs/QA_AULA_04_WEB.md',
    'lessons/aula-02-vite-vue-componentizacao/course/checkers/04.mjs',
    'lessons/aula-02-vite-vue-componentizacao/course/lib/update.mjs',
    'lessons/aula-02-vite-vue-componentizacao/course/runner.mjs',
    'tools/aula04/README.md',
    'tools/aula04/activity.html',
    'tools/aula04/activity.js',
    'tools/aula04/build.py',
    'tools/aula04/deck.html',
    'tools/aula04/deck.js',
    'tools/aula04/example.json',
    'tools/aula04/slides.py',
    'tools/aula04/spec.json',
}
if (ROOT / 'tools/aula04/build.py').exists():
    print('Fontes ja materializadas; preservando as fontes legiveis existentes.')
    raise SystemExit(0)

# A ultima parte e o gatilho do workflow. As anteriores sao apenas transporte.
parts = [ROOT / ('tools/aula04-source.part-%02d' % i) for i in range(1, 6)]
parts.append(ROOT / 'tools/aula04-source.b64')
encoded = ''.join(p.read_text(encoding='ascii').strip() for p in parts)
if len(encoded) > 100000:
    raise SystemExit('Pacote excede o tamanho autorizado.')
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != EXPECTED:
    raise SystemExit('Integridade do pacote de fontes diverge. Nenhum arquivo foi escrito.')
payload = json.loads(lzma.decompress(compressed, memlimit=128*1024*1024))
if payload.get('schema') != 1 or set(payload.get('files', {})) != ALLOWED:
    raise SystemExit('Manifesto de fontes incompativel.')
for relative, text in payload['files'].items():
    if not isinstance(text, str) or len(text.encode('utf-8')) > 100000:
        raise SystemExit('Conteudo de fonte incompativel.')
    pure = PurePosixPath(relative)
    if pure.is_absolute() or '..' in pure.parts:
        raise SystemExit('Caminho incompativel.')
    target = ROOT / relative
    for parent in [target, *target.parents]:
        if parent == ROOT:
            break
        if parent.is_symlink():
            raise SystemExit('Link simbolico nao permitido.')
    if target.exists():
        raise SystemExit('Fonte ja existente; nao sera sobrescrita: ' + relative)
for relative, text in payload['files'].items():
    target = ROOT / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8', newline='\n')
print('14 fontes publicas materializadas. Nenhum src/ ou dependencia alterado.')
