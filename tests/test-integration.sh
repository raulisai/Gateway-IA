#!/bin/bash

# Script de prueba de integración Backend-Frontend
# Uso: ./test-integration.sh

echo "🚀 Test de Integración Gateway-IA"
echo "=================================="
echo ""

# Variables
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
API_URL="$BACKEND_URL/api/v1"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un servicio está corriendo
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name está corriendo en $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name NO está corriendo en $url"
        return 1
    fi
}

# 1. Verificar que el backend esté corriendo
echo "1️⃣  Verificando Backend..."
if ! check_service "$BACKEND_URL/docs" "Backend"; then
    echo -e "${YELLOW}⚠${NC}  Inicia el backend con: cd backend && python run.py"
    exit 1
fi
echo ""

# 2. Verificar que el frontend esté corriendo
echo "2️⃣  Verificando Frontend..."
if ! check_service "$FRONTEND_URL" "Frontend"; then
    echo -e "${YELLOW}⚠${NC}  Inicia el frontend con: cd frontend-gateway-ia && npm run dev"
    exit 1
fi
echo ""

# 3. Crear un usuario de prueba
echo "3️⃣  Creando usuario de prueba..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "username": "testuser",
        "password": "TestPass123!"
    }')

if echo "$SIGNUP_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓${NC} Usuario creado exitosamente"
    ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
else
    # Intentar login si el usuario ya existe
    echo -e "${YELLOW}⚠${NC}  Usuario ya existe, intentando login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser",
            "password": "TestPass123!"
        }')
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        echo -e "${GREEN}✓${NC} Login exitoso"
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    else
        echo -e "${RED}✗${NC} No se pudo autenticar"
        echo "$LOGIN_RESPONSE"
        exit 1
    fi
fi
echo ""

# 4. Verificar endpoint de analytics overview
echo "4️⃣  Probando Analytics Overview..."
OVERVIEW_RESPONSE=$(curl -s -X GET "$API_URL/analytics/overview?days=1" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$OVERVIEW_RESPONSE" | grep -q "total_requests"; then
    echo -e "${GREEN}✓${NC} Analytics Overview funciona"
    echo "$OVERVIEW_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$OVERVIEW_RESPONSE"
else
    echo -e "${RED}✗${NC} Error en Analytics Overview"
    echo "$OVERVIEW_RESPONSE"
fi
echo ""

# 5. Verificar endpoint de cost breakdown
echo "5️⃣  Probando Cost Breakdown..."
COST_RESPONSE=$(curl -s -X GET "$API_URL/analytics/cost-breakdown?days=7" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$COST_RESPONSE" | grep -q "\["; then
    echo -e "${GREEN}✓${NC} Cost Breakdown funciona"
    echo "$COST_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo -e "${RED}✗${NC} Error en Cost Breakdown"
    echo "$COST_RESPONSE"
fi
echo ""

# 6. Verificar endpoint de model distribution
echo "6️⃣  Probando Model Distribution..."
MODEL_RESPONSE=$(curl -s -X GET "$API_URL/analytics/model-distribution?days=7" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$MODEL_RESPONSE" | grep -q "\["; then
    echo -e "${GREEN}✓${NC} Model Distribution funciona"
    echo "$MODEL_RESPONSE" | python3 -m json.tool 2>/dev/null
else
    echo -e "${RED}✗${NC} Error en Model Distribution"
    echo "$MODEL_RESPONSE"
fi
echo ""

# 7. Verificar endpoint de requests recientes
echo "7️⃣  Probando Recent Requests..."
REQUESTS_RESPONSE=$(curl -s -X GET "$API_URL/analytics/requests?limit=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$REQUESTS_RESPONSE" | grep -q "\["; then
    echo -e "${GREEN}✓${NC} Recent Requests funciona"
    REQUEST_COUNT=$(echo "$REQUESTS_RESPONSE" | grep -o '"id"' | wc -l)
    echo "  Requests encontrados: $REQUEST_COUNT"
else
    echo -e "${RED}✗${NC} Error en Recent Requests"
    echo "$REQUESTS_RESPONSE"
fi
echo ""

# 8. Crear una Provider Key de prueba
echo "8️⃣  Creando Provider Key..."
PROVIDER_KEY_RESPONSE=$(curl -s -X POST "$API_URL/provider-keys" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "provider": "openai",
        "key": "sk-test123456789"
    }')

if echo "$PROVIDER_KEY_RESPONSE" | grep -q "id"; then
    echo -e "${GREEN}✓${NC} Provider Key creada"
else
    echo -e "${YELLOW}⚠${NC}  No se pudo crear Provider Key (puede ya existir)"
fi
echo ""

# 9. Crear una Gateway Key de prueba
echo "9️⃣  Creando Gateway Key..."
GATEWAY_KEY_RESPONSE=$(curl -s -X POST "$API_URL/keys" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Key",
        "rate_limit": 100
    }')

if echo "$GATEWAY_KEY_RESPONSE" | grep -q "key"; then
    echo -e "${GREEN}✓${NC} Gateway Key creada"
    GATEWAY_KEY=$(echo "$GATEWAY_KEY_RESPONSE" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    echo "  Key: $GATEWAY_KEY"
else
    echo -e "${YELLOW}⚠${NC}  No se pudo crear Gateway Key"
fi
echo ""

# 10. Listar Gateway Keys
echo "🔟 Listando Gateway Keys..."
KEYS_LIST=$(curl -s -X GET "$API_URL/keys" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$KEYS_LIST" | grep -q "\["; then
    KEYS_COUNT=$(echo "$KEYS_LIST" | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓${NC} Gateway Keys listadas: $KEYS_COUNT keys"
else
    echo -e "${RED}✗${NC} Error listando Gateway Keys"
fi
echo ""

# Resumen final
echo "=================================="
echo -e "${GREEN}✅ Test de integración completado${NC}"
echo ""
echo "🌐 Accede al frontend en: $FRONTEND_URL"
echo "📚 Accede a la API docs en: $BACKEND_URL/docs"
echo ""
echo "Credenciales de prueba:"
echo "  Email: test@example.com"
echo "  Username: testuser"
echo "  Password: TestPass123!"
echo ""
