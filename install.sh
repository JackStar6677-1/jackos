#!/usr/bin/env bash
# Instalador JackOS por partes.  Uso:  ./install.sh [parte ...]   |   ./install.sh todo   |   ./install.sh lista
# Sin argumentos muestra la lista. Todo va a tu $HOME salvo `sddm` (pide sudo y NO lo activa).
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"
say() { printf '\033[38;5;178m▌\033[0m %s\n' "$*"; }
need() { command -v "$1" >/dev/null || { echo "  falta '$1' ($2)"; return 1; }; }

lista() { cat <<'T'
Partes disponibles:
  terminal   bash (fzf/zoxide/eza/bat), perfil y esquema Blackwall de Konsole, fastfetch
  barra      plasmoides JackOS Monitor y JackOS Ticker para la barra de Plasma 6
  esfera     esfera Jarvis como widget flotante (necesita npm y python3-pyqt6.qtwebengine)
  wallpaper  variables VA-API para fondo de video fluido (reinicia sesión después)
  splash     pantalla de carga de Plasma (JackOS.splash)
  sddm       pantalla de login animada (pide sudo; la copia pero NO la activa)
  todo       terminal + barra + esfera + wallpaper + splash (sddm solo si lo pides)
Ejemplos:  ./install.sh terminal barra     ./install.sh todo     ./install.sh todo sddm
T
}

terminal() {
  say "terminal"
  mkdir -p ~/.config/bash ~/.local/share/konsole ~/.config/fastfetch
  cp "$D/jackos-terminal.sh" ~/.config/bash/
  cp "$D"/konsole/* ~/.local/share/konsole/
  cp "$D"/fastfetch/* ~/.config/fastfetch/
  grep -q jackos-terminal ~/.bashrc || printf '\n[ -f "$HOME/.config/bash/jackos-terminal.sh" ] && . "$HOME/.config/bash/jackos-terminal.sh"\n' >> ~/.bashrc
  echo "  Opcional: sudo apt install fastfetch fzf eza bat zoxide  (+ fuente JetBrainsMono Nerd Font)"
  echo "  Konsole: elige el perfil JackOS (esquema JackOS-Blackwall, 82 % de opacidad con blur)"
}

barra() {
  say "barra (plasmoides)"
  mkdir -p ~/.local/share/plasma/plasmoids
  cp -r "$D"/plasma/org.jackos.* ~/.local/share/plasma/plasmoids/
  echo "  Clic derecho en el panel > Añadir widgets > JackOS Monitor y JackOS Ticker"
  echo "  Fondo negro: BackgroundNormal=0,0,0 en [Colors:Window] y [Colors:Complementary] del 'colors' de tu tema"
  echo "  (~/.local/share/plasma/desktoptheme/<tema>/colors), borra ~/.cache/ksvg-elements y reinicia plasmashell"
}

esfera() {
  say "esfera (widget flotante)"
  need npm "sudo apt install npm" || return 1
  python3 -c 'import PyQt6.QtWebEngineWidgets' 2>/dev/null || echo "  falta PyQt6 WebEngine: sudo apt install python3-pyqt6.qtwebengine"
  local dst=~/.local/share/jackos/esfera
  mkdir -p "$dst" ~/.local/bin
  cp -r "$D"/esfera/. "$dst"/
  (cd "$dst" && npm install --silent && python3 demo/generar_demo.py >/dev/null)
  printf '#!/usr/bin/env bash\nexec python3 %s/widget.py "$@"\n' "$dst" > ~/.local/bin/jackos-esfera
  chmod +x ~/.local/bin/jackos-esfera
  echo "  Lanza con: jackos-esfera   (regla de KWin para posicionarla: mira esfera/README.md)"
}

wallpaper() {
  say "wallpaper (VA-API)"
  mkdir -p ~/.config/environment.d
  cp "$D"/wallpaper/90-qt-media-vaapi.conf ~/.config/environment.d/
  echo "  Reinicia sesión. Plugin: Smart Video Wallpaper Reborn (mira wallpaper/README.md)"
}

splash() {
  say "splash"
  need kpackagetool6 "Plasma 6" || return 1
  kpackagetool6 --type Plasma/LookAndFeel --install "$D/splash/JackOS.splash" 2>/dev/null \
    || kpackagetool6 --type Plasma/LookAndFeel --upgrade "$D/splash/JackOS.splash"
  echo "  Actívalo en Ajustes > Apariencia > Pantalla de bienvenida"
}

sddm() {
  say "sddm (sudo)"
  sudo cp -r "$D"/sddm/jackos-sovereign /usr/share/sddm/themes/
  echo "  Prueba:   sddm-greeter-qt6 --test-mode --theme /usr/share/sddm/themes/jackos-sovereign"
  echo "  Activa:   printf '[Theme]\\nCurrent=jackos-sovereign\\n' | sudo tee /etc/sddm.conf.d/30-jackos.conf"
  echo "  Rescate:  desde una TTY (Ctrl+Alt+F3): sudo rm /etc/sddm.conf.d/30-jackos.conf && sudo reboot"
}

[ $# -eq 0 ] && { lista; exit 0; }
for p in "$@"; do
  case "$p" in
    lista|-h|--help) lista ;;
    todo) terminal; barra; esfera || true; wallpaper; splash || true ;;
    terminal|barra|esfera|wallpaper|splash|sddm) "$p" ;;
    *) echo "parte desconocida: $p"; lista; exit 1 ;;
  esac
done
say "listo"
