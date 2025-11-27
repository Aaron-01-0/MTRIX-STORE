
# Load Environment Variables
$envFile = Get-Content .env
$urlLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_URL" }
$keyLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_PUBLISHABLE_KEY" }

$supabaseUrl = $urlLine.Split('=')[1].Trim().Trim('"').Trim("'")
$anonKey = $keyLine.Split('=')[1].Trim().Trim('"').Trim("'")

$email = "admin.gamma@mtrix.store"
$password = "MtrixAdmin2025!"

$headers = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

Write-Host "Attempting to create user $email..."

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/signup" -Method Post -Headers $headers -Body $body
    Write-Host "Signup Request Sent!"
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "Signup Failed: $_"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "Details: $($reader.ReadToEnd())"
}
