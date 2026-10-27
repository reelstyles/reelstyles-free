# ReelStyles setup for Windows PowerShell (5.1+). Same commands as setup.sh:
#   powershell -ExecutionPolicy Bypass -File setup\setup.ps1 check                 is this machine ready? (exit 1 if not)
#   ... setup.ps1 install [--dry-run|--yes] [node ffmpeg git chrome]                installs what is missing; asks before each tool, shows the exact command
#   ... setup.ps1 wire auto|list|<agent>... [--global] [--dir <project>]            points your AI agent(s) at the ReelStyles skill
#   ... setup.ps1 test                                                             5 s smoke render, prints the mp4 path and the render time
# Only winget (or your fnm / nvm-windows) installs anything. No telemetry: HyperFrames' own is switched off below.
# Agent docs checked 2026-10-16: see the table at the wire section of setup.sh (same paths).
$ErrorActionPreference = 'Continue'   # 'Stop' turns any native stderr line into an error in PowerShell 5.1
$NAME = 'reelstyles'                                  # filled by tools/pack-repo.mjs
$HF = 'hyperframes@0.8.96'; $NODE_MIN = 22; $DISK_MIN_GB = 2
$env:HYPERFRAMES_NO_TELEMETRY = '1'; $env:DO_NOT_TRACK = '1'; $env:HYPERFRAMES_NO_UPDATE_CHECK = '1'; $env:HYPERFRAMES_NO_FEEDBACK = '1'
$REPO = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path -replace '\\', '/'
$SKILL = "$REPO/skills/$NAME/SKILL.md"
$Cmd = $args[0]; $Rest = @($args | Select-Object -Skip 1)
if (-not $Cmd) { $Cmd = 'check' }

if ($PSVersionTable.PSVersion.Major -ge 6 -and -not $IsWindows) { & bash (Join-Path $PSScriptRoot 'setup.sh') $Cmd @Rest; exit $LASTEXITCODE }

function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Ok($m) { Write-Host "  ok      $m" -ForegroundColor Green }
function Bad($m) { Write-Host "  MISSING $m" -ForegroundColor Red }
function Note($m) { Write-Host "  --      $m" -ForegroundColor Yellow }
function Hf { & npx -y $HF @args }
function NodeOk { if (-not (Has node)) { return $false }; [int](& node -p "process.versions.node.split('.')[0]") -ge $NODE_MIN }
function ChromeOk {
  if (-not (NodeOk)) { return $false }
  $j = (Hf doctor --json 2>$null) -join "`n"
  $i = $j.IndexOf('{'); if ($i -lt 0) { return $false }
  $c = ($j.Substring($i) | ConvertFrom-Json).checks | Where-Object { $_.name -eq 'Chrome' }
  [bool]($c -and $c.ok)
}
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }

function Check {
  $fail = $false
  Write-Host "ReelStyles check (windows, package manager: $(if (Has winget) {'winget'} else {'none'}))"
  if (NodeOk) { Ok "Node.js $(node -v)" } else { Bad "Node.js >= $NODE_MIN"; $fail = $true }
  if ((Has ffmpeg) -and (Has ffprobe)) { Ok 'ffmpeg' } else { Bad 'ffmpeg + ffprobe'; $fail = $true }
  if (Has git) { Ok "git $((git --version) -replace 'git version ', '')" } else { Note 'git not found (only needed to clone/update the repo; the zip works without it)' }
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
    'chrome' { return "npx -y $HF browser ensure" }
  }
  return $null
}
function Missing {
  if (-not (NodeOk)) { 'node' }
  if (-not ((Has ffmpeg) -and (Has ffprobe))) { 'ffmpeg' }
  if (-not (Has git)) { 'git' }
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
$DIR = (Get-Location).Path -replace '\\', '/'; $GLOBAL = $false
$POINT = "When the user asks for a video, an animation, a Short/Reel/TikTok or a film in a ReelStyles style, read ``$SKILL`` and follow it step by step (its styles, formats and render steps sit next to it). If ReelStyles setup has not passed on this machine (``bash setup/setup.sh check``, on Windows ``setup\setup.ps1 check``, both in ``$REPO``), run the setup skill ``$REPO/skills/$NAME-setup/SKILL.md`` first."
$DESC = 'Make an animated video in a ReelStyles style (cut-paper, cartoon, collage, 3D and more) rendered with HyperFrames. Use for any video, film, Short or animation request.'
$U8 = New-Object System.Text.UTF8Encoding $false
function Put($f, $s) {
  New-Item -ItemType Directory -Force (Split-Path $f) | Out-Null
  $s = $s -replace "`r`n", "`n"
  if ((Test-Path $f) -and ([IO.File]::ReadAllText($f) -eq "$s`n")) { Write-Host "  unchanged $f" } else { [IO.File]::WriteAllText($f, "$s`n", $U8); Write-Host "  wrote     $f" }
}
function Block($f) {   # replace or append our marked block inside a file the user may also edit
  $old = ''; if (Test-Path $f) { $old = [IO.File]::ReadAllText($f) }
  $kept = [regex]::Replace($old, '(?s)<!-- reelstyles:start -->.*?<!-- reelstyles:end -->\r?\n?', '')
  if ($kept -and -not $kept.EndsWith("`n")) { $kept += "`n" }
  Put $f ($kept + "<!-- reelstyles:start -->`n## ReelStyles`n$POINT`n<!-- reelstyles:end -->")
}
function SkillFile($root) { Put "$root/$NAME/SKILL.md" "---`nname: $NAME`ndescription: $DESC`n---`n`n$POINT" }
function WireOne($a) {
  $d = $DIR; $h = $env:USERPROFILE -replace '\\', '/'
  Write-Host "${a}:"
  switch ("${a}:$([int]$GLOBAL)") {
    'claude:0' { SkillFile "$d/.claude/skills" }
    'claude:1' { SkillFile "$h/.claude/skills" }
    'codex:0' { SkillFile "$d/.agents/skills"; if ($d -ne $REPO) { Block "$d/AGENTS.md" } }
    'codex:1' { SkillFile "$h/.agents/skills"; $ch = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { "$h/.codex" }; Block "$ch/AGENTS.md" }
    'cursor:0' { Put "$d/.cursor/rules/reelstyles.mdc" "---`ndescription: $DESC`nalwaysApply: false`n---`n`n$POINT" }
    'cursor:1' { Write-Host "  Cursor keeps user rules in its settings, not in a file. Paste this into Cursor > Settings > Rules:`n`n$POINT" }
    'roo:0' { Put "$d/.roo/rules/reelstyles.md" "# ReelStyles`n$POINT" }
    'roo:1' { Put "$h/.roo/rules/reelstyles.md" "# ReelStyles`n$POINT" }
    'cline:0' { Put "$d/.clinerules/reelstyles.md" "# ReelStyles`n$POINT" }
    'cline:1' { Put "$([Environment]::GetFolderPath('MyDocuments') -replace '\\', '/')/Cline/Rules/reelstyles.md" "# ReelStyles`n$POINT" }
    'gemini:0' { Block "$d/GEMINI.md" }
    'gemini:1' { Block "$h/.gemini/GEMINI.md" }
    'copilot:0' { Block "$d/.github/copilot-instructions.md" }
    'copilot:1' { SkillFile "$h/.copilot/skills" }
    'windsurf:0' { $r = if (Test-Path "$d/.devin") { '.devin/rules' } else { '.windsurf/rules' }; Put "$d/$r/reelstyles.md" "---`ntrigger: model_decision`ndescription: $DESC`n---`n`n$POINT" }
    'windsurf:1' { Block "$h/.codeium/windsurf/memories/global_rules.md" }
    default { Write-Host "  unknown agent '$a' (use: claude codex cursor roo cline gemini copilot windsurf)" }
  }
}
function Detect {
  $d = $DIR; $h = $env:USERPROFILE; $docs = [Environment]::GetFolderPath('MyDocuments')
  $T = { param($p) Test-Path $p }
  if ((Has claude) -or (& $T "$h/.claude") -or (& $T "$d/.claude")) { 'claude' }
  if ((Has codex) -or (& $T "$h/.codex")) { 'codex' }
  if ((Has cursor) -or (& $T "$h/.cursor") -or (& $T "$d/.cursor")) { 'cursor' }
  if ((& $T "$h/.roo") -or (& $T "$d/.roo") -or (& $T "$d/.roorules")) { 'roo' }
  if ((Has cline) -or (& $T "$h/.cline") -or (& $T "$docs/Cline") -or (& $T "$d/.clinerules") -or (& $T "$d/.cline")) { 'cline' }
  if ((Has gemini) -or (& $T "$h/.gemini") -or (& $T "$d/.gemini")) { 'gemini' }
  if ((& $T "$h/.copilot") -or (& $T "$d/.github/copilot-instructions.md")) { 'copilot' }
  if ((Has windsurf) -or (& $T "$h/.codeium/windsurf") -or (& $T "$d/.windsurf") -or (& $T "$d/.devin")) { 'windsurf' }
}
function Wire($a) {
  $agents = @(); $i = 0
  while ($i -lt $a.Count) {
    switch ($a[$i]) { '--global' { $script:GLOBAL = $true } '--dir' { $i++; $script:DIR = (Resolve-Path $a[$i]).Path -replace '\\', '/' } default { $agents += $a[$i] } }
    $i++
  }
  if (-not $agents) { $agents = @('auto') }
  if ($agents[0] -eq 'list') { Write-Host "Detected: $(@(Detect) -join ' ')"; return $true }
  if ($agents[0] -eq 'auto') {
    $agents = @(Detect)
    $pl = "$env:USERPROFILE/.claude/plugins/installed_plugins.json"
    if ((Test-Path $pl) -and (Select-String -Quiet -SimpleMatch "`"$NAME@" $pl)) { $agents = @($agents | Where-Object { $_ -ne 'claude' }); Write-Host "claude: the $NAME plugin is installed, nothing to wire." }
    if ($agents -notcontains 'codex') { $agents += 'codex' }   # AGENTS.md + .agents/skills: read by most agents
  }
  $where = if ($script:GLOBAL) { 'your user settings' } else { $script:DIR }
  Write-Host "Wiring ReelStyles into $where (pointer files only; the kits stay in $REPO)"
  foreach ($x in $agents) { WireOne $x }
  Write-Host 'Done. Restart your agent (or start a new chat) so it reads the new files.'; return $true
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
