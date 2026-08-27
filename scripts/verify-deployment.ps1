# Production-flow smoke test: signup -> discovery -> profile -> conversation ->
# message -> reload, plus CORS behaviour. Point $Base at any deployed API.
param(
  [string]$Base = $env:AURA_E2E_BASE,
  [string]$Origin = $env:AURA_E2E_ORIGIN
)
if (-not $Base) { $Base = 'http://localhost:4100' }
if (-not $Origin) { $Origin = 'https://aura-mvp.vercel.app' }

$ErrorActionPreference = 'Stop'
$pass = 0; $fail = 0
function Check($name, $ok, $detail) {
  if ($ok) { $script:pass++; Write-Host "PASS  $name $detail" -ForegroundColor Green }
  else { $script:fail++; Write-Host "FAIL  $name $detail" -ForegroundColor Red }
}

$email = "e2e.$([guid]::NewGuid().ToString('N').Substring(0,10))@aura.dev"
$password = 'AuraDeploy12345'
$session = $null
$token = $null
# Note: do not name this `H` â€” PowerShell resolves the built-in `h` alias first.
function Get-AuthHeaders { return @{ Authorization = "Bearer $script:token"; Origin = $script:Origin } }

# 1. health
try {
  $h = Invoke-RestMethod "$Base/health"
  Check 'health' ($h.data.status -eq 'ok') "database=$($h.data.database)"
} catch { Check 'health' $false $_.Exception.Message }

# 2. signup
try {
  $r = Invoke-RestMethod "$Base/api/v1/auth/signup" -Method Post -ContentType 'application/json' `
    -Headers @{ Origin = $Origin } -Body (@{ email = $email; password = $password; name = 'E2E Tester' } | ConvertTo-Json) `
    -SessionVariable session
  $token = $r.data.tokens.accessToken
  Check 'signup' ([bool]$token) $email
} catch { Check 'signup' $false $_.Exception.Message }

# 3. login (fresh session, exercises the refresh cookie)
try {
  $r = Invoke-RestMethod "$Base/api/v1/auth/login" -Method Post -ContentType 'application/json' `
    -Headers @{ Origin = $Origin } -Body (@{ email = $email; password = $password } | ConvertTo-Json) `
    -SessionVariable session
  $token = $r.data.tokens.accessToken
  $cookie = $session.Cookies.GetCookies($Base) | Where-Object { $_.Name -eq 'refresh_token' }
  $cookieOk = [bool]$cookie -or -not $Base.StartsWith('https://')
  Check 'login' ([bool]$token -and $cookieOk) "refreshCookie=$([bool]$cookie)"
} catch { Check 'login' $false $_.Exception.Message }

# 4. refresh via cookie. The refresh cookie is Secure in production, so it is
# only storable over HTTPS — skip rather than fail when testing a plain-HTTP base.
if ($Base.StartsWith('https://')) {
  try {
    $r = Invoke-RestMethod "$Base/api/v1/auth/refresh" -Method Post -Headers @{ Origin = $Origin } -WebSession $session
    $token = $r.data.accessToken
    Check 'refresh' ([bool]$token) ''
  } catch { Check 'refresh' $false $_.Exception.Message }
} else {
  Write-Host "SKIP  refresh (Secure cookie requires HTTPS)" -ForegroundColor Yellow
}

# 5. identity
try {
  $me = Invoke-RestMethod "$Base/api/v1/social/me" -Headers (Get-AuthHeaders) -WebSession $session
  Check 'social identity' ([bool]$me.data.id) "@$($me.data.handle)"
} catch { Check 'social identity' $false $_.Exception.Message }

# 6. companion discovery
$companion = $null
try {
  $list = Invoke-RestMethod "$Base/api/v1/social/profiles" -Headers (Get-AuthHeaders) -WebSession $session
  $companion = $list.data | Where-Object { $_.type -eq 'AI' } | Select-Object -First 1
  Check 'companion discovery' ([bool]$companion) "profiles=$($list.data.Count) ai=$($companion.displayName)"
} catch { Check 'companion discovery' $false $_.Exception.Message }

# 7. companion profile
if ($companion) {
  try {
    $p = Invoke-RestMethod "$Base/api/v1/social/profiles/$($companion.id)" -Headers (Get-AuthHeaders) -WebSession $session
    Check 'companion profile' ($p.data.id -eq $companion.id) "@$($p.data.handle)"
  } catch { Check 'companion profile' $false $_.Exception.Message }
}

# 8-10. conversation + message + reload
$conversationId = $null
if ($companion) {
  try {
    $c = Invoke-RestMethod "$Base/api/v1/social/conversations" -Method Post -ContentType 'application/json' `
      -Headers (Get-AuthHeaders) -WebSession $session -Body (@{ profileId = $companion.id; channel = 'chat'; topic = 'E2E deploy check' } | ConvertTo-Json)
    $conversationId = $c.data.id
    Check 'create conversation' ([bool]$conversationId) ''
  } catch { Check 'create conversation' $false $_.Exception.Message }
}
if ($conversationId) {
  try {
    $m = Invoke-RestMethod "$Base/api/v1/social/conversations/$conversationId/messages" -Method Post `
      -ContentType 'application/json' -Headers (Get-AuthHeaders) -WebSession $session -Body (@{ text = 'Hello from the deployment smoke test.' } | ConvertTo-Json)
    $reply = $m.data.messages | Where-Object { $_.author -eq 'participant' } | Select-Object -Last 1
    Check 'send message' ($m.data.messages.Count -ge 2) "messages=$($m.data.messages.Count)"
    Check 'receive response' ([bool]$reply.text -and $reply.status -eq 'sent') "status=$($reply.status) reply='$($reply.text)'"
  } catch { Check 'send message / receive response' $false $_.Exception.Message }

  try {
    $again = Invoke-RestMethod "$Base/api/v1/social/conversations/$conversationId" -Headers (Get-AuthHeaders) -WebSession $session
    Check 'reopen conversation' ($again.data.messages.Count -ge 2) "persisted=$($again.data.messages.Count)"
  } catch { Check 'reopen conversation' $false $_.Exception.Message }
}

# 11. CORS â€” allowed origin
try {
  $r = Invoke-WebRequest "$Base/api/v1/auth/refresh" -Method Options -UseBasicParsing `
    -Headers @{ Origin = $Origin; 'Access-Control-Request-Method' = 'POST' }
  Check 'CORS allow' ($r.Headers['Access-Control-Allow-Origin'] -eq $Origin) "credentials=$($r.Headers['Access-Control-Allow-Credentials'])"
} catch { Check 'CORS allow' $false $_.Exception.Message }

# 12. CORS â€” disallowed origin must not receive the header
try {
  $r = Invoke-WebRequest "$Base/api/v1/auth/refresh" -Method Options -UseBasicParsing `
    -Headers @{ Origin = 'https://evil.example.com'; 'Access-Control-Request-Method' = 'POST' }
  Check 'CORS deny' (-not $r.Headers['Access-Control-Allow-Origin']) "status=$($r.StatusCode)"
} catch { Check 'CORS deny' $false $_.Exception.Message }

# 13. production error handling â€” 401 and 404 stay structured envelopes
try {
  Invoke-RestMethod "$Base/api/v1/social/me" -Headers @{ Origin = $Origin } | Out-Null
  Check 'unauthenticated 401' $false 'request unexpectedly succeeded'
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check 'unauthenticated 401' ($code -eq 401) "status=$code"
}
try {
  Invoke-RestMethod "$Base/api/v1/does-not-exist" -Headers @{ Origin = $Origin } | Out-Null
  Check 'unknown route 404' $false 'request unexpectedly succeeded'
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  $body = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
  Check 'unknown route 404' ($code -eq 404 -and $body -notmatch 'at .*\\.js:') "status=$code no-stack-leak"
}

Write-Host ""
Write-Host "RESULT: $pass passed, $fail failed  (base=$Base)" -ForegroundColor ($(if ($fail -eq 0) { 'Green' } else { 'Red' }))
if ($fail -gt 0) { exit 1 }

