# ReelStyles setup for Windows PowerShell (5.1+). Same commands as setup.sh:
#   powershell -ExecutionPolicy Bypass -File setup\setup.ps1 check                 is this machine ready? (exit 1 if not)
#   ... setup.ps1 install [--dry-run|--yes] [node ffmpeg git chrome]                installs what is missing; asks before each tool, shows the exact command
#   ... setup.ps1 wire auto|list|<agent>... [--global] [--dir <project>]            points your AI agent(s) at the ReelStyles skill
#   ... setup.ps1 test                                                             5 s smoke render, prints the mp4 path and the render time
# Only winget (or your fnm / nvm-windows) installs anything. No telemetry: HyperFrames' own is switched off below.
$ErrorActionPreference = 'Continue'   # 'Stop' turns any native stderr line into an error in PowerShell 5.1
$HF = 'hyperframes@0.8.96'; $NODE_MIN = 22; $DISK_MIN_GB = 2
$env:HYPERFRAMES_NO_TELEMETRY = '1'; $env:DO_NOT_TRACK = '1'; $env:HYPERFRAMES_NO_UPDATE_CHECK = '1'; $env:HYPERFRAMES_NO_FEEDBACK = '1'
$REPO = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path -replace '\\', '/'
$Cmd = $args[0]; $Rest = @($args | Select-Object -Skip 1)
if (-not $Cmd) { $Cmd = 'check' }

if ($PSVersionTable.PSVersion.Major -ge 6 -and -not $IsWindows) { & bash (Join-Path $PSScriptRoot 'setup.sh') $Cmd @Rest; exit $LASTEXITCODE }

function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Ok($m) { Write-Host "  ok      $m" -ForegroundColor Green }
function Bad($m) { Write-Host "  MISSING $m" -ForegroundColor Red }
function Note($m) { Write-Host "  --      $m" -ForegroundColor Yellow }
function Hf { & npx.cmd -y $HF @args }   # npx.cmd, not npm's npx.ps1 shim: splatting through that shim lost the arguments ("No command specified", 11-14)
function NodeOk { if (-not (Has node)) { return $false }; [int](& node -p "process.versions.node.split('.')[0]") -ge $NODE_MIN }
function ChromeOk {
  if (-not (NodeOk)) { return $false }
  $j = (Hf doctor --json 2>$null) -join "`n"
  $i = $j.IndexOf('{'); if ($i -lt 0) { return $false }
  $c = ($j.Substring($i) | ConvertFrom-Json).checks | Where-Object { $_.name -eq 'Chrome' }
  [bool]($c -and $c.ok)
}
function GitBash {   # the kits render with bash tools/render.sh: on Windows that is Git Bash (Git for Windows)
  $g = Get-Command git -ErrorAction SilentlyContinue
  foreach ($b in @($(if ($g) { Join-Path (Split-Path (Split-Path $g.Source)) 'bin/bash.exe' }), "$env:ProgramFiles/Git/bin/bash.exe", "$env:LOCALAPPDATA/Programs/Git/bin/bash.exe")) { if ($b -and (Test-Path $b)) { return $b } }
  return $null
}
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }

function Check {
  $fail = $false
  Write-Host "ReelStyles check (windows, package manager: $(if (Has winget) {'winget'} else {'none'}))"
  if (NodeOk) { Ok "Node.js $(node -v)" } else { Bad "Node.js >= $NODE_MIN"; $fail = $true }
  if ((Has ffmpeg) -and (Has ffprobe)) { Ok 'ffmpeg' } else { Bad 'ffmpeg + ffprobe'; $fail = $true }
  $gbash = GitBash
  if ($gbash) { Ok "Git Bash: $gbash (agents render with it: & '$gbash' tools/render.sh)" } else { Bad 'Git Bash (comes with Git for Windows; every kit renders with bash tools/render.sh)'; $fail = $true }
  $gb = [math]::Floor((Get-PSDrive ($env:USERPROFILE.Substring(0, 1))).Free / 1GB)
  if ($gb -ge $DISK_MIN_GB) { Ok "disk: $gb GB free" } else { Bad "disk: $gb GB free, need $DISK_MIN_GB GB"; $fail = $true }
  if (-not (NodeOk)) { Bad 'Chrome for HyperFrames (check again after Node is installed)'; $fail = $true }
  elseif (ChromeOk) { Ok "Chrome for HyperFrames ($HF)" }
  else { Bad 'Chrome for HyperFrames (run: setup.ps1 install chrome)'; $fail = $true }
  if ($fail) { Write-Host 'NOT READY. See what is missing: setup.ps1 install --dry-run' } else { Write-Host 'READY. Next: setup.ps1 test' }
  return -not $fail
}

function CmdFor($t) {
  switch ($t) {
    'node' {
      if (Has fnm) { return "fnm install $NODE_MIN; fnm use $NODE_MIN" }
      if (Has nvm) { return "nvm install $NODE_MIN; nvm use $NODE_MIN" }   # nvm-windows
      if (Has winget) { return 'winget install -e --id OpenJS.NodeJS.LTS' }
    }
    'ffmpeg' { if (Has winget) { return 'winget install -e --id Gyan.FFmpeg' } }
    'git' { if (Has winget) { return 'winget install -e --id Git.Git' } }
    'chrome' { return "npx.cmd -y $HF browser ensure" }
  }
  return $null
}
function Missing {
  if (-not (NodeOk)) { 'node' }
  if (-not ((Has ffmpeg) -and (Has ffprobe))) { 'ffmpeg' }
  if (-not (GitBash)) { 'git' }
  if (-not (ChromeOk)) { 'chrome' }
}
function Install($a) {
  $mode = 'ask'; $tools = @()
  foreach ($x in $a) { if ($x -eq '--dry-run') { $mode = 'dry' } elseif ($x -in '--yes', '-y') { $mode = 'yes' } else { $tools += $x } }
  if (-not $tools) { $tools = @(Missing) }
  if (-not $tools) { Write-Host 'Nothing to install.'; return (Check) }
  foreach ($t in $tools) {
    $c = CmdFor $t
    if (-not $c) { Write-Host "${t}: winget not found. Install it by hand: https://nodejs.org | https://ffmpeg.org/download.html | https://git-scm.com"; continue }
    Write-Host "`n${t}: $c"
    if ($mode -eq 'dry') { continue }
    if ($mode -eq 'ask' -and (Read-Host 'Run this now? [y/N]') -notmatch '^(y|yes)$') { Write-Host "skipped $t"; continue }
    try { Invoke-Expression $c } catch { Write-Host "${t}: the command failed: $_" }
    Refresh-Path
  }
  if ($mode -eq 'dry') { return $true }
  if (NodeOk) { Write-Host "`nPre-fetching $HF ..."; Hf --version *> $null }
  Write-Host ''
  if (Check) { return $true }
  Write-Host 'Open a new terminal if you just installed something, then run check again.'; return $false
}

# ---------- wire ----------
# Where each agent reads instructions and skills: one table in setup/agents.mjs (shared with setup.sh and the pack builder).
function Wire($a) {
  if (-not (NodeOk)) { Write-Host "Node.js >= $NODE_MIN is missing: setup.ps1 install"; return $false }
  & node "$PSScriptRoot/agents.mjs" wire @a | Out-Host; return ($LASTEXITCODE -eq 0)
}

function Test-Render {
  if (-not (NodeOk)) { Write-Host "Node.js >= $NODE_MIN is missing: setup.ps1 install"; return $false }
  $w = Join-Path $env:TEMP 'reelstyles-smoke'
  Remove-Item -Recurse -Force $w -ErrorAction SilentlyContinue; New-Item -ItemType Directory $w | Out-Null
  Copy-Item "$REPO/setup/test/index.html" $w
  Write-Host "Rendering a 5 s test film in $w ..."
  $sw = [Diagnostics.Stopwatch]::StartNew()
  Hf render $w -o "$w/smoke.mp4" --quality draft --workers 1 --quiet
  $sw.Stop()
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path "$w/smoke.mp4")) { Write-Host 'Render FAILED. Run: setup.ps1 check'; return $false }
  $dur = & ffprobe -v error -show_entries format=duration -of csv=p=0 "$w/smoke.mp4"
  Write-Host "OK: $w\smoke.mp4 ($dur s of film, rendered in $([int]$sw.Elapsed.TotalSeconds) s)"
  Write-Host 'ReelStyles is ready: ask me for a video in any style from STYLES.md'; return $true
}

$okay = switch ($Cmd) {
  'check' { Check }
  'install' { Install @($Rest) }
  'wire' { Wire @($Rest) }
  'test' { Test-Render }
  default { Get-Content $PSCommandPath -TotalCount 6 | Select-Object -Skip 1; $false }
}
if (@($okay)[-1]) { exit 0 } else { exit 1 }
