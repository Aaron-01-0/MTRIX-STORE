
$envFile = Get-Content .env
$urlLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_URL" }
$keyLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_PUBLISHABLE_KEY" }

$url = $urlLine.Split('=')[1].Trim().Trim('"').Trim("'")
$key = $keyLine.Split('=')[1].Trim().Trim('"').Trim("'")

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
}

Write-Host "Testing connection to $url"

try {
    $response = Invoke-RestMethod -Uri "$url/rest/v1/categories?select=count" -Headers $headers -Method Get
    Write-Host "Success! Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "Error: $_"
}
