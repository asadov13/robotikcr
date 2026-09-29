$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js tapilmadi. Node.js qurasdirib yeniden acin.' }
    & node server.cjs
} finally {
    Pop-Location
}
