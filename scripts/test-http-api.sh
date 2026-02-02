#!/bin/bash

# Script para testar a API HTTP do Tax Virtual Office
# Uso: ./scripts/test-http-api.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 Testando API HTTP do Tax Virtual Office"
echo "Base URL: $BASE_URL"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer requisição e mostrar resultado
test_query() {
  local name="$1"
  local question="$2"
  local context="${3:-}"
  
  echo -e "${YELLOW}Teste: $name${NC}"
  echo "Pergunta: $question"
  if [ -n "$context" ]; then
    echo "Contexto: $context"
  fi
  echo ""
  
  # Montar JSON
  if [ -n "$context" ]; then
    json_body=$(cat <<EOF
{
  "question": "$question",
  "context": "$context"
}
EOF
)
  else
    json_body=$(cat <<EOF
{
  "question": "$question"
}
EOF
)
  fi
  
  # Fazer requisição
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/query" \
    -H "Content-Type: application/json" \
    -d "$json_body")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ Sucesso (HTTP $http_code)${NC}"
    echo "Resposta:"
    echo "$body" | jq -r '.answer // .' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ Erro (HTTP $http_code)${NC}"
    echo "Resposta:"
    echo "$body"
  fi
  
  echo ""
  echo "---"
  echo ""
}

# Verificar se servidor está rodando
echo "Verificando se servidor está rodando..."
if ! curl -s "$BASE_URL/api-docs" > /dev/null 2>&1; then
  echo -e "${RED}❌ Servidor não está rodando em $BASE_URL${NC}"
  echo "Execute: npm start"
  exit 1
fi

echo -e "${GREEN}✅ Servidor está rodando${NC}"
echo ""

# Testes
test_query \
  "NF-e - Tamanho de campo" \
  "Qual o tamanho máximo do campo cProd na NF-e?" \
  "Estou implementando emissão de NF-e"

test_query \
  "NFC-e - Contingência" \
  "Como funciona a contingência offline da NFC-e?" \
  "Preciso implementar contingência em PDV"

test_query \
  "Reforma Tributária - Cronograma" \
  "Qual o cronograma de transição para IBS e CBS?" \
  "Preciso entender o impacto da reforma tributária"

test_query \
  "Tabela CFOP" \
  "Qual o CFOP para venda de produto no estado?" \
  "Operação dentro do mesmo estado"

test_query \
  "CT-e - Modal de transporte" \
  "Quais são os campos obrigatórios do CT-e para modal rodoviário?" \
  "Implementando emissão de CT-e rodoviário"

test_query \
  "Legislação IBS" \
  "Como funciona o cálculo de IBS?" \
  "Preciso entender a base de cálculo"

echo -e "${GREEN}✅ Todos os testes concluídos${NC}"










