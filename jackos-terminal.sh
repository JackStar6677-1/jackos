# JackOS terminal extras: fzf (Ctrl+R/T/Alt+C), zoxide (z), eza/bat si existen
[ -f /usr/share/doc/fzf/examples/key-bindings.bash ] && . /usr/share/doc/fzf/examples/key-bindings.bash
export FZF_DEFAULT_OPTS='--height=40% --reverse --border --color=bg+:#1a1530,fg+:#e8e6ef,hl:#d9aa58,hl+:#d9aa58,pointer:#d4001a,prompt:#7d55d9,marker:#d4001a,info:#7d55d9'
command -v zoxide >/dev/null && eval "$(zoxide init bash)"
if command -v eza >/dev/null; then
  alias ls='eza --group-directories-first --icons=auto'
  alias ll='eza -lh --group-directories-first --icons=auto --git'
  alias la='eza -lAh --group-directories-first --icons=auto --git'
  alias tree='eza --tree --icons=auto'
fi
if command -v batcat >/dev/null && ! command -v bat >/dev/null; then alias bat=batcat; fi
command -v bat >/dev/null || command -v batcat >/dev/null && { alias cat='bat --paging=never --style=plain' ; export MANPAGER="sh -c 'col -bx | ${BAT:-batcat} -l man -p'"; }
