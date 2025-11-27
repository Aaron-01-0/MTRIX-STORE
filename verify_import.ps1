
# Load Environment Variables
$envFile = Get-Content .env
$urlLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_URL" }
$keyLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_PUBLISHABLE_KEY" }

$supabaseUrl = $urlLine.Split('=')[1].Trim().Trim('"').Trim("'")
$anonKey = $keyLine.Split('=')[1].Trim().Trim('"').Trim("'")

$email = "admin.gamma@mtrix.store"
$password = "MtrixAdmin2025!"

# Login to get access token
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method Post -Headers @{ "apikey" = $anonKey; "Content-Type" = "application/json" } -Body $loginBody
$accessToken = $loginResponse.access_token

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $accessToken"
    "Prefer" = "count=exact"
}

function Get-Count($table) {
    try {
        $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/$table?select=*&limit=1" -Method Get -Headers $headers -UseBasicParsing
        $range = $response.Headers["Content-Range"]
        if ($range) {
            return $range.Split('/')[1]
        }
        return "Unknown"
    } catch {
        return "Error: $_"
    }
}

Write-Host "Verifying Import Counts..."
Write-Host "Categories: $(Get-Count 'categories')"
Write-Host "Products: $(Get-Count 'products')"
Write-Host "Variants: $(Get-Count 'product_variants')"
