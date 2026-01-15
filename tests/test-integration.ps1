# Script de prueba de integración Backend-Frontend
# Uso: .\test-integration.ps1

Write-Host "🚀 Test de Integración Gateway-IA" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$BACKEND_URL = "http://localhost:8000"
$FRONTEND_URL = "http://localhost:3000"
$API_URL = "$BACKEND_URL/api/v1"

# Función para verificar si un servicio está corriendo
function Test-Service {
    param(
        [string]$Url,
        [string]$Name
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ $Name está corriendo en $Url" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $Name NO está corriendo en $Url" -ForegroundColor Red
        return $false
    }
}

# 1. Verificar que el backend esté corriendo
Write-Host "1️⃣  Verificando Backend..."
if (-not (Test-Service -Url "$BACKEND_URL/docs" -Name "Backend")) {
    Write-Host "⚠  Inicia el backend con: cd backend; python run.py" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Verificar que el frontend esté corriendo
Write-Host "2️⃣  Verificando Frontend..."
if (-not (Test-Service -Url $FRONTEND_URL -Name "Frontend")) {
    Write-Host "⚠  Inicia el frontend con: cd frontend-gateway-ia; npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 3. Crear un usuario de prueba
Write-Host "3️⃣  Creando usuario de prueba..."
$signupBody = @{
    email = "test@example.com"
    username = "testuser"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$API_URL/auth/signup" `
        -Method POST `
        -Body $signupBody `
        -ContentType "application/json"
    
    Write-Host "✓ Usuario creado exitosamente" -ForegroundColor Green
    $ACCESS_TOKEN = $signupResponse.access_token
} catch {
    Write-Host "⚠  Usuario ya existe, intentando login..." -ForegroundColor Yellow
    
    $loginBody = @{
        username = "testuser"
        password = "TestPass123!"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
            -Method POST `
            -Body $loginBody `
            -ContentType "application/json"
        
        Write-Host "✓ Login exitoso" -ForegroundColor Green
        $ACCESS_TOKEN = $loginResponse.access_token
    } catch {
        Write-Host "✗ No se pudo autenticar" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}
Write-Host ""

# Headers con el token
$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
}

# 4. Verificar endpoint de analytics overview
Write-Host "4️⃣  Probando Analytics Overview..."
try {
    $overviewResponse = Invoke-RestMethod -Uri "$API_URL/analytics/overview?days=1" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Analytics Overview funciona" -ForegroundColor Green
    $overviewResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "✗ Error en Analytics Overview" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 5. Verificar endpoint de cost breakdown
Write-Host "5️⃣  Probando Cost Breakdown..."
try {
    $costResponse = Invoke-RestMethod -Uri "$API_URL/analytics/cost-breakdown?days=7" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Cost Breakdown funciona" -ForegroundColor Green
    $costResponse | Select-Object -First 5 | ConvertTo-Json -Depth 3
} catch {
    Write-Host "✗ Error en Cost Breakdown" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 6. Verificar endpoint de model distribution
Write-Host "6️⃣  Probando Model Distribution..."
try {
    $modelResponse = Invoke-RestMethod -Uri "$API_URL/analytics/model-distribution?days=7" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Model Distribution funciona" -ForegroundColor Green
    $modelResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "✗ Error en Model Distribution" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 7. Verificar endpoint de requests recientes
Write-Host "7️⃣  Probando Recent Requests..."
try {
    $requestsResponse = Invoke-RestMethod -Uri "$API_URL/analytics/requests?limit=10" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Recent Requests funciona" -ForegroundColor Green
    $requestCount = $requestsResponse.Count
    Write-Host "  Requests encontrados: $requestCount"
} catch {
    Write-Host "✗ Error en Recent Requests" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
Write-Host ""

# 8. Crear una Provider Key de prueba
Write-Host "8️⃣  Creando Provider Key..."
$providerKeyBody = @{
    provider = "openai"
    key = "sk-test123456789"
} | ConvertTo-Json

try {
    $providerKeyResponse = Invoke-RestMethod -Uri "$API_URL/provider-keys" `
        -Method POST `
        -Headers $headers `
        -Body $providerKeyBody `
        -ContentType "application/json"
    
    Write-Host "✓ Provider Key creada" -ForegroundColor Green
} catch {
    Write-Host "⚠  No se pudo crear Provider Key (puede ya existir)" -ForegroundColor Yellow
}
Write-Host ""

# 9. Crear una Gateway Key de prueba
Write-Host "9️⃣  Creando Gateway Key..."
$gatewayKeyBody = @{
    name = "Test Key"
    rate_limit = 100
} | ConvertTo-Json

try {
    $gatewayKeyResponse = Invoke-RestMethod -Uri "$API_URL/keys" `
        -Method POST `
        -Headers $headers `
        -Body $gatewayKeyBody `
        -ContentType "application/json"
    
    Write-Host "✓ Gateway Key creada" -ForegroundColor Green
    Write-Host "  Key: $($gatewayKeyResponse.key)"
} catch {
    Write-Host "⚠  No se pudo crear Gateway Key" -ForegroundColor Yellow
}
Write-Host ""

# 10. Listar Gateway Keys
Write-Host "🔟 Listando Gateway Keys..."
try {
    $keysList = Invoke-RestMethod -Uri "$API_URL/keys" `
        -Method GET `
        -Headers $headers
    
    $keysCount = $keysList.Count
    Write-Host "✓ Gateway Keys listadas: $keysCount keys" -ForegroundColor Green
} catch {
    Write-Host "✗ Error listando Gateway Keys" -ForegroundColor Red
}
Write-Host ""

# Resumen final
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Test de integración completado" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Accede al frontend en: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "📚 Accede a la API docs en: $BACKEND_URL/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  Email: test@example.com"
Write-Host "  Username: testuser"
Write-Host "  Password: TestPass123!"
Write-Host ""
