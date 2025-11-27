
# Load Environment Variables
$envFile = Get-Content .env
$urlLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_URL" }
$keyLine = $envFile | Where-Object { $_ -match "VITE_SUPABASE_PUBLISHABLE_KEY" }

$supabaseUrl = $urlLine.Split('=')[1].Trim().Trim('"').Trim("'")
$anonKey = $keyLine.Split('=')[1].Trim().Trim('"').Trim("'")

$csvPath = "MTRIX_Master_List.csv"

# Auth Credentials
$adminEmail = "admin.gamma@mtrix.store"
$adminPassword = "MtrixAdmin2025!"

# Headers for Anon requests (Login)
$anonHeaders = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

Write-Host "Starting Import..."
Write-Host "URL: $supabaseUrl"

# 1. Authenticate
Write-Host "Authenticating as $adminEmail..."
$authBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" -Method Post -Headers $anonHeaders -Body $authBody
    $accessToken = $authResponse.access_token
    Write-Host "Authentication Successful!"
} catch {
    Write-Host "Authentication Failed: $_"
    exit
}

# Headers for Admin requests (Authenticated)
$authHeaders = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation" # Return the created object
}

# 2. Read CSV
$data = Import-Csv $csvPath

# Caches to avoid repeated API calls
$categoryCache = @{} # Name -> ID
$productCache = @{} # Name -> ID

# Helper to guess variant type
function Get-VariantType($v) {
    $v = $v.ToLower()
    if ($v -in @('xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '11 oz', '600 ml', '750 ml')) { return 'Size' }
    if ($v.Contains('frame')) { return 'Frame' }
    if ($v.Contains('zipper')) { return 'Style' }
    if ($v -in @('regular', 'acrylic')) { return 'Material' }
    return 'Option'
}

foreach ($row in $data) {
    $catName = $row.Category.Trim()
    $prodName = $row.Product.Trim()
    $varName = $row.Variant.Trim()

    if (-not $catName -or -not $prodName -or -not $varName) { continue }

    # --- CATEGORY ---
    if (-not $categoryCache.ContainsKey($catName)) {
        # Check if exists
        try {
            $existingCat = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/categories?name=eq.$([Uri]::EscapeDataString($catName))&select=id" -Method Get -Headers $authHeaders
            if ($existingCat.Count -gt 0) {
                $categoryCache[$catName] = $existingCat[0].id
            } else {
                # Create
                $newCatBody = @{ name = $catName } | ConvertTo-Json
                $newCat = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/categories" -Method Post -Headers $authHeaders -Body $newCatBody
                $categoryCache[$catName] = $newCat[0].id
                Write-Host "Created Category: $catName"
            }
        } catch {
            Write-Host "Error processing category $catName : $_"
            continue
        }
    }
    $catId = $categoryCache[$catName]

    # --- PRODUCT ---
    if (-not $productCache.ContainsKey($prodName)) {
        # Check if exists
        try {
            $existingProd = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/products?name=eq.$([Uri]::EscapeDataString($prodName))&category_id=eq.$catId&select=id" -Method Get -Headers $authHeaders
            if ($existingProd.Count -gt 0) {
                $productCache[$prodName] = $existingProd[0].id
            } else {
                # Create
                $sku = "$($catName.Substring(0,3).ToUpper())-$($prodName.Substring(0,3).ToUpper())-$(Get-Random -Minimum 1000 -Maximum 9999)"
                $newProdBody = @{
                    name = $prodName
                    category_id = $catId
                    base_price = 999
                    sku = $sku
                    is_active = $true
                } | ConvertTo-Json
                $newProd = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/products" -Method Post -Headers $authHeaders -Body $newProdBody
                $productCache[$prodName] = $newProd[0].id
                Write-Host "Created Product: $prodName"
            }
        } catch {
            Write-Host "Error processing product $prodName : $_"
            continue
        }
    }
    $prodId = $productCache[$prodName]

    # --- VARIANT ---
    $varType = Get-VariantType $varName
    
    try {
        # Check if exists
        $existingVar = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/product_variants?product_id=eq.$prodId&variant_name=eq.$([Uri]::EscapeDataString($varName))&select=id" -Method Get -Headers $authHeaders
        
        if ($existingVar.Count -eq 0) {
            $newVarBody = @{
                product_id = $prodId
                variant_type = $varType
                variant_name = $varName
                stock_quantity = 100
                price_adjustment = 0
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/product_variants" -Method Post -Headers $authHeaders -Body $newVarBody | Out-Null
            Write-Host "  + Added Variant: $varName ($varType)"
        }
    } catch {
        Write-Host "Error processing variant $varName : $_"
    }
}

Write-Host "Import Completed!"
