# One-click deploy — double-click karo ya `npm run deploy` chalao.
# Build pass → commit → GitHub push. Vercel GitHub se auto-deploy karta hai,
# isliye Vercel dashboard kholne ki zaroorat nahi (sirf build fail ho to dekhna).
# Pehli baar ek setup chahiye (neeche ONE-TIME SETUP dekho) — uske baad token kabhi nahi mangega.
#
# Usage:
#   npm run deploy
#   npm run deploy -- "apna message yahan"
#   (direct) powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 "apna message"

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# gh se login ho to git uska token khud use kare (dobara token nahi mangega)
try { gh auth setup-git 2>$null | Out-Null } catch { }

Write-Host '--- 1/3: Build check (npm run build) ---'
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host 'BUILD FAILED — push roka gaya. Upar error theek karke dobara chalao.' -ForegroundColor Red
  exit 1
}

Write-Host '--- 2/3: Commit ---'
git add -A
$changes = git status --porcelain
if (-not $changes) {
  Write-Host 'Koi naya change nahi — commit skip.' -ForegroundColor Yellow
} else {
  if ($args.Count -gt 0) { $msg = ($args -join ' ') } else { $msg = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
  git commit -m $msg
  Write-Host "Committed: $msg" -ForegroundColor Green
}

Write-Host '--- 3/3: Push (GitHub to Vercel auto-deploy) ---'
git push origin main
Write-Host ''
Write-Host 'DONE - 2-4 min me live hoga. Kuch aur karne ki zaroorat nahi.' -ForegroundColor Green
