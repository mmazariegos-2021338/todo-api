#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

render() {
  local title="$1"
  local input="$2"
  local output="$3"
  local html="$DIR/.tmp-terminal.html"
  python3 - "$title" "$input" "$html" <<'PY'
import html, sys
title, path, out = sys.argv[1:4]
text = open(path, encoding='utf-8').read()
body = html.escape(text)
open(out, 'w', encoding='utf-8').write(f'''<!doctype html>
<html><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>
  body {{ margin:0; background:#0d1117; }}
  .window {{ margin:24px; border-radius:10px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,.35); max-width:980px; }}
  .bar {{ background:#161b22; color:#c9d1d9; padding:10px 14px; font:600 13px -apple-system,BlinkMacSystemFont,sans-serif; border-bottom:1px solid #30363d; }}
  pre {{ margin:0; padding:18px; background:#0d1117; color:#e6edf3; font:13px/1.45 Menlo,Monaco,Consolas,monospace; white-space:pre-wrap; }}
</style></head><body><div class="window"><div class="bar">{html.escape(title)}</div><pre>{body}</pre></div></body></html>''')
PY
  "$CHROME" --headless --disable-gpu --window-size=1024,720 \
    --screenshot="$DIR/$output" "file://$html" >/dev/null 2>&1
}

render "docker images" "$DIR/terminal-docker-images.txt" "captura-docker-images.png"
render "docker push devmar17/25004557:1.0" "$DIR/terminal-docker-push.txt" "captura-docker-push.png"
render "ssh root@134.209.65.91 — despliegue v1.0" "$DIR/terminal-ssh-despliegue.txt" "captura-ssh-despliegue.png"
render "docker ps (servidor)" "$DIR/terminal-server-ps.txt" "captura-docker-ps-server.png"
render "docker logs (servidor)" "$DIR/terminal-server-logs.txt" "captura-docker-logs.png"
render "Actualización 1.0 → 2.0 (Recreate)" "$DIR/terminal-server-update.txt" "captura-actualizacion.png"
render "Rollback 2.0 → 1.0" "$DIR/terminal-server-rollback.txt" "captura-rollback.png"

rm -f "$DIR/.tmp-terminal.html"
echo "Capturas generadas en $DIR"
