#!/bin/bash

# Script de teste local para Tax Virtual Office
# Testa os endpoints básicos do servidor

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-30}"

echo "🧪 Testando Tax Virtual Office"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local path=$3
    local data=$4
    
    echo -n "Testando $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$BASE_URL$path" || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$path" || echo -e "\n000")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "  Resposta: $(echo "$body" | head -c 100)..."
        fi
        return 0
    else
        echo -e "${RED}✗ FALHOU${NC} (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "  Erro: $body"
        fi
        return 1
    fi
}

# Verificar se o servidor está rodando
echo "Verificando se o servidor está rodando..."
if ! curl -s --max-time 2 "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Servidor não está respondendo em $BASE_URL${NC}"
    echo ""
    echo "Por favor, inicie o servidor primeiro:"
    echo "  npm run dev"
    echo "  ou"
    echo "  npm start"
    exit 1
fi

echo -e "${GREEN}✓ Servidor está rodando${NC}"
echo ""

# Teste 1: Health Check
test_endpoint "Health Check" "GET" "/health" ""

echo ""

# Teste 2: Query Simples
test_endpoint "Query Simples" "POST" "/query" '{
  "question": "O que é uma NF-e?",
  "context": "Teste básico de funcionamento"
}'

echo ""

# Teste 3: Query sobre NF-e
test_endpoint "Query sobre NF-e" "POST" "/query" '{
  "question": "Qual o prazo para cancelar uma NF-e?",
  "context": "Empresa precisa cancelar nota emitida há 2 dias"
}'

echo ""
echo "================================"
echo -e "${GREEN}✓ Testes concluídos${NC}"
echo ""
echo "Para ver mais detalhes, verifique os logs do servidor."
