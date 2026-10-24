#!/usr/bin/env python3
"""Compatibility launcher for the real-browser blocked QA probe.

HtmlService wraps/escapes user HTML inside its sandbox. Looking for a literal
'"ok":false' in the raw HTTP body is not a valid receipt test. The browser probe
validates the actual postMessage origin/channel/nonce and blocked GETs.

Install the lesson's locked npm dependencies and Chromium first. Only payload {}
is submitted. This launcher never enables submissions or writes student data.
"""
from pathlib import Path
import shutil
import subprocess
import sys


def main() -> int:
    node = shutil.which("node")
    runner = Path(__file__).resolve().with_name("web_a05_http_blocked_browser.mjs")
    if not node or not runner.is_file():
        print("HTTP_PROBE_SETUP_FAIL: Node.js ou instrumento de navegador ausente.")
        return 2
    print("Usando protocolo real do navegador; HTML bruto não comprova recibo.", flush=True)
    try:
        result = subprocess.run([node, str(runner)], check=False, timeout=180)
        return result.returncode if result.returncode >= 0 else 1
    except subprocess.TimeoutExpired:
        print("HTTP_PROBE_TIMEOUT: nenhuma aprovação inferida; conferir diagnóstico.")
        return 3
    except OSError:
        print("HTTP_PROBE_SETUP_FAIL: não foi possível iniciar o navegador.")
        return 4


if __name__ == "__main__":
    sys.exit(main())
