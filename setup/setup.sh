#!/usr/bin/env bash
# ReelStyles setup (macOS, Linux, WSL, Git Bash on Windows). Same commands as setup.ps1.
#   bash setup/setup.sh check                      is this machine ready? (exit 1 if not)
#   bash setup/setup.sh install [--dry-run|--yes] [node ffmpeg git chrome]
#                                                  installs what is missing; asks before each tool, shows the exact command
#   bash setup/setup.sh wire auto|list|<agent>... [--global] [--dir <project>]
#                                                  points your AI agent(s) at the ReelStyles skill (agents: claude codex opencode cursor roo cline gemini copilot windsurf)
#   bash setup/setup.sh test                       5 s smoke render, prints the mp4 path and the render time
# Only official package managers (Homebrew, apt, dnf, winget) and the official nvm installer. No telemetry: HyperFrames' own is switched off below.
set -euo pipefail
HF="hyperframes@0.8.96"; NODE_MIN=22; NVM_VER="v0.40.8"; DISK_MIN_GB=2
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_NO_UPDATE_CHECK=1 HYPERFRAMES_NO_FEEDBACK=1
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
winpath() { if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else echo "$1"; fi; }   # Git Bash: /c/x -> C:/x for agents
ok()   { printf '  \033[32mok\033[0m    %s\n' "$*"; }
bad()  { printf '  \033[31mMISSING\033[0m %s\n' "$*"; }
note() { printf '  \033[33m--\033[0m    %s\n' "$*"; }
hf()   { npx -y "$HF" "$@"; }

os() {
  case "$(uname -s)" in
    Darwin) echo macos ;;
    Linux)  grep -qi microsoft /proc/version 2>/dev/null && echo wsl || echo linux ;;
    MINGW*|MSYS*|CYGWIN*) echo windows ;;
    *) echo unknown ;;
  esac
}
pm() {   # the platform's package manager
  if [ "$(os)" = windows ]; then command -v winget >/dev/null && echo winget && return; fi
  for p in brew apt-get dnf; do command -v $p >/dev/null && { echo $p; return; }; done
  echo none
}
SUDO=""; [ "$(id -u 2>/dev/null || echo 1)" != 0 ] && command -v sudo >/dev/null && SUDO="sudo "

node_ok() { command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge $NODE_MIN ]; }
load_nvm() { [ -s "$HOME/.nvm/nvm.sh" ] && { set +u; . "$HOME/.nvm/nvm.sh"; set -u; } || true; }
chrome_ok() {   # HyperFrames' own Chrome check (it downloads its headless Chrome on `browser ensure`)
  node_ok || return 1
  hf doctor --json 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const c=JSON.parse(s.slice(s.indexOf("{"))).checks.find(c=>c.name==="Chrome");process.exit(c&&c.ok?0:1)})' 2>/dev/null
}
disk_gb() { df -Pk "$HOME" 2>/dev/null | awk 'NR==2{print int($4/1048576)}'; }

check() {
  local fail=0
  echo "ReelStyles check ($(os), package manager: $(pm))"
  load_nvm
  if node_ok; then ok "Node.js $(node -v)"; else bad "Node.js >= $NODE_MIN (have: $(node -v 2>/dev/null || echo none))"; fail=1; fi
  if command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; then ok "ffmpeg $(ffmpeg -version | awk 'NR==1{print $3}')"; else bad "ffmpeg + ffprobe"; fail=1; fi
  if command -v git >/dev/null; then ok "git $(git --version | awk '{print $3}')"; else note "git not found (only needed to clone/update the repo; the zip works without it)"; fi
  local gb; gb="$(disk_gb)"; if [ "${gb:-0}" -ge $DISK_MIN_GB ]; then ok "disk: ${gb} GB free"; else bad "disk: ${gb:-?} GB free, need ${DISK_MIN_GB} GB"; fail=1; fi
  if ! node_ok; then bad "Chrome for HyperFrames (check again after Node is installed)"; fail=1
  elif chrome_ok; then ok "Chrome for HyperFrames ($HF)"
  else bad "Chrome for HyperFrames (run: bash setup/setup.sh install chrome)"; fail=1; fi
  if [ $fail = 0 ]; then echo "READY. Next: bash setup/setup.sh test"; else echo "NOT READY. See what is missing: bash setup/setup.sh install --dry-run"; fi
  return $fail
}

# ---------- install ----------
apt() { echo "${SUDO}apt-get update && ${SUDO}DEBIAN_FRONTEND=noninteractive apt-get install -y $*"; }
t64() {   # Ubuntu 24.04+ renamed some libraries to <name>t64 (libasound2 became a virtual package apt cannot pick). ponytail: needs apt lists (any desktop has them; a bare container gets them from the ffmpeg step)
  local out="" x; for x in "$@"; do apt-cache show "${x}t64" >/dev/null 2>&1 && x="${x}t64"; out="$out $x"; done; echo "$out"
}
cmd_for() {   # prints the exact shell command that installs $1 here, or nothing
  local p; p="$(pm)"
  case "$1:$p" in
    node:*) if command -v fnm >/dev/null; then echo "fnm install $NODE_MIN && fnm use $NODE_MIN"
            elif [ -s "$HOME/.nvm/nvm.sh" ]; then echo ". ~/.nvm/nvm.sh && nvm install $NODE_MIN"
            elif [ "$p" = brew ]; then echo "brew install node"
            elif [ "$p" = winget ]; then echo "winget install -e --id OpenJS.NodeJS.LTS"
            else   # Linux / WSL: nvm's official installer, shipped as setup/nvm-install.sh (distro Node packages are often older than $NODE_MIN), no sudo
              local pre=""; command -v curl >/dev/null || case "$p" in apt-get) pre="$(apt curl ca-certificates) && ";; dnf) pre="${SUDO}dnf install -y curl && ";; esac
              echo "${pre}bash \"$REPO/setup/nvm-install.sh\" && . ~/.nvm/nvm.sh && nvm install $NODE_MIN"
            fi ;;
    ffmpeg:brew) echo "brew install ffmpeg" ;;
    ffmpeg:apt-get) apt ffmpeg ;;
    ffmpeg:dnf) echo "${SUDO}dnf install -y ffmpeg   # Fedora: needs RPM Fusion, or use ffmpeg-free" ;;
    ffmpeg:winget) echo "winget install -e --id Gyan.FFmpeg" ;;
    git:brew) echo "brew install git" ;;
    git:apt-get) apt git ;;
    git:dnf) echo "${SUDO}dnf install -y git" ;;
    git:winget) echo "winget install -e --id Git.Git" ;;
    chrome:*)   # HyperFrames downloads its own headless Chrome; on Linux it needs a few system libraries
      local libs=""
      case "$p" in
        apt-get) libs="$(apt unzip fonts-liberation $(t64 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2)) && " ;;
        dnf) libs="${SUDO}dnf install -y unzip nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib liberation-fonts && " ;;
      esac
      echo "${libs}npx -y $HF browser ensure" ;;
  esac
}
missing() {   # tools that are not there yet
  load_nvm
  node_ok || echo node
  { command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null; } || echo ffmpeg
  command -v git >/dev/null || echo git
  chrome_ok || echo chrome
}
install() {
  local mode=ask tools=() t c ans
  for a in "$@"; do case "$a" in --dry-run) mode=dry ;; --yes|-y) mode=yes ;; *) tools+=("$a") ;; esac; done
  [ ${#tools[@]} = 0 ] && tools=($(missing))   # no mapfile: macOS ships bash 3.2
  [ ${#tools[@]} = 0 ] && { echo "Nothing to install."; check; return; }
  for t in "${tools[@]}"; do
    c="$(cmd_for "$t")"
    if [ -z "$c" ]; then echo "$t: no package manager found here. Install it by hand: https://nodejs.org | https://ffmpeg.org/download.html | https://git-scm.com"; continue; fi
    echo; echo "$t: $c"
    [ $mode = dry ] && continue
    if [ $mode = ask ]; then printf 'Run this now? [y/N] '; read -r ans || ans=""; case "$ans" in y|Y|yes) ;; *) echo "skipped $t"; continue ;; esac; fi
    bash -c "$c" < /dev/null || echo "$t: the command failed (see above)."   # /dev/null: the installers must not eat the next answer
    [ "$t" = node ] && load_nvm
  done
  [ $mode = dry ] && return 0
  if node_ok; then echo; echo "Pre-fetching $HF ..."; hf --version >/dev/null 2>&1 || true; fi
  echo; check || { echo "Open a new terminal if you just installed Node, then run check again."; return 1; }
}

# ---------- wire ----------
# Where each agent reads instructions and skills: one table in setup/agents.mjs (shared with setup.ps1 and the pack builder).
wire() {
  load_nvm; node_ok || { echo "Node.js >= $NODE_MIN is missing: bash setup/setup.sh install"; return 1; }
  node "$REPO/setup/agents.mjs" wire "$@"
}

# ---------- test ----------
test_render() {
  load_nvm; node_ok || { echo "Node.js >= $NODE_MIN is missing: bash setup/setup.sh install"; return 1; }
  local w="${TMPDIR:-/tmp}/reelstyles-smoke" t0 t1
  rm -rf "$w"; mkdir -p "$w"; cp "$REPO/setup/test/index.html" "$w/"
  echo "Rendering a 5 s test film in $w ..."
  t0=$(date +%s)
  hf render "$w" -o "$w/smoke.mp4" --quality draft --workers 1 --quiet || { echo "Render FAILED. Run: bash setup/setup.sh check"; return 1; }
  t1=$(date +%s)
  local dur; dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$w/smoke.mp4" 2>/dev/null || echo "?")"
  [ -s "$w/smoke.mp4" ] || { echo "Render FAILED: no mp4"; return 1; }
  echo "OK: $(winpath "$w/smoke.mp4") (${dur} s of film, rendered in $((t1 - t0)) s)"
  echo "ReelStyles is ready: ask me for a video in any style from STYLES.md"
}

case "${1:-check}" in
  check) check ;;
  install) shift; install "$@" ;;
  wire) shift; wire "$@" ;;
  test) test_render ;;
  *) sed -n '2,9p' "$0"; exit 2 ;;
esac
