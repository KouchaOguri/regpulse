# RegPulse Step 1 Automated Cloudflare Infrastructure Provisioner
# Safe Credentials Protocol: reads CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN strictly
# from environment variables or ~/.env (NEVER prints secrets to stdout or logs).

$ErrorActionPreference = "Stop"

function Load-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  foreach ($line in Get-Content $Path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $k = $Matches[1]
      $v = $Matches[2].Trim().Trim('"').Trim("'")
      if (-not [Environment]::GetEnvironmentVariable($k)) {
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
      }
    }
  }
}

Load-DotEnv (Join-Path $env:USERPROFILE ".env")
Load-DotEnv (Join-Path $PSScriptRoot "..\.env")

if (-not $env:CLOUDFLARE_ACCOUNT_ID -or -not $env:CLOUDFLARE_API_TOKEN) {
  Write-Error "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in environment or ~/.env. Aborting safely."
  exit 1
}

$workerDir = Join-Path $PSScriptRoot "..\fulfillment-worker"
Set-Location $workerDir

Write-Host "[1/4] Verifying Cloudflare token against account..."
$headers = @{
  "Authorization" = "Bearer $($env:CLOUDFLARE_API_TOKEN)"
  "Content-Type"  = "application/json"
}
$verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -Method Get
if (-not $verify.success) {
  Write-Error "Cloudflare API Token verification failed."
  exit 1
}
Write-Host "      PASS: Cloudflare API token active."

Write-Host "[2/4] Ensuring Cloudflare D1 database 'regpulse-prod' exists..."
$d1List = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$($env:CLOUDFLARE_ACCOUNT_ID)/d1/database" -Headers $headers -Method Get
$existingDb = $d1List.result | Where-Object { $_.name -eq "regpulse-prod" } | Select-Object -First 1
if (-not $existingDb) {
  $created = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$($env:CLOUDFLARE_ACCOUNT_ID)/d1/database" -Headers $headers -Method Post -Body (@{ name = "regpulse-prod" } | ConvertTo-Json)
  $dbId = $created.result.uuid
  Write-Host "      Created D1 database regpulse-prod (id=$dbId)"
} else {
  $dbId = $existingDb.uuid
  Write-Host "      Reusing existing D1 database regpulse-prod (id=$dbId)"
}

Write-Host "[3/4] Writing D1 binding into wrangler.toml and applying schema.sql..."
$tomlPath = Join-Path $workerDir "wrangler.toml"
$toml = Get-Content $tomlPath -Raw
if ($toml -notmatch 'database_id\s*=\s*"[0-9a-f-]{36}"') {
  $bindingBlock = "`n[[d1_databases]]`nbinding = `"DB`"`ndatabase_name = `"regpulse-prod`"`ndatabase_id = `"$dbId`"`n"
  Add-Content -Path $tomlPath -Value $bindingBlock
}

npx wrangler d1 execute regpulse-prod --remote --file=./schema.sql
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/4] Deploying regpulse-fulfillment Worker..."
npx wrangler deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "DONE: Cloudflare D1 + Fulfillment Worker provisioned cleanly."
