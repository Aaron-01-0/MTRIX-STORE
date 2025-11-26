# Read .env file
$envContent = Get-Content .env
$anonKey = $null
$supabaseUrl = "https://tguflnxyewjuuzckcemo.supabase.co"

foreach ($line in $envContent) {
    if ($line -match "SUPABASE_ANON_KEY=(.*)") {
        $anonKey = $matches[1]
    }
    if ($line -match "VITE_SUPABASE_PUBLISHABLE_KEY=(.*)") {
        $anonKey = $matches[1]
    }
}

if (-not $anonKey) {
    Write-Host "Error: Could not find SUPABASE_ANON_KEY in .env file" -ForegroundColor Red
    exit
}

$orderId = "5d227cdd-03b7-4ba6-98d0-d65a70777415"
$url = "$supabaseUrl/functions/v1/send-order-confirmation"

Write-Host "Testing email function for order: $orderId"
Write-Host "URL: $url"

$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

$body = @{
    order_id = $orderId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}
