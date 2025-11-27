$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndWZsbnh5ZXdqdXV6Y2tjZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTczNjQsImV4cCI6MjA3OTU3MzM2NH0.guRpNkR1srNhpJYMxafT21gL-pwpTYiCRaydrFb-2nU"
$supabaseUrl = "https://tguflnxyewjuuzckcemo.supabase.co"

$email = "raj00.mkv@gmail.com"
$url = "$supabaseUrl/functions/v1/subscribe-launch"

Write-Host "Testing subscribe-launch function for email: $email"
Write-Host "URL: $url"

$headers = @{
    "Authorization" = "Bearer $anonKey"
    "apikey" = "$anonKey"
    "Content-Type" = "application/json"
}

$body = @{
    email = $email
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
