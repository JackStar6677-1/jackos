#!/usr/bin/env bash
# Instala los extras de terminal JackOS (sin sudo salvo apt opcional)
set -e
D="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.config/bash ~/.local/share/konsole
cp "$D/jackos-terminal.sh" ~/.config/bash/
cp "$D"/konsole/* ~/.local/share/konsole/
grep -q jackos-terminal ~/.bashrc || printf '\n[ -f "$HOME/.config/bash/jackos-terminal.sh" ] && . "$HOME/.config/bash/jackos-terminal.sh"\n' >> ~/.bashrc
echo "Opcional: sudo apt install fzf eza bat zoxide"
echo "Konsole: Ajustes > Perfiles > JackOS (fuente JetBrainsMono Nerd Font)"
