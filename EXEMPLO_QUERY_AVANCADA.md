# Exemplo de Query Avançada para Teste do FileSearch

## Query Complexa para Testar Busca em Vector Stores

### Exemplo 1: Consulta sobre Cancelamento e Validação de NF-e

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Ao implementar o cancelamento de uma NF-e, quais são os campos obrigatórios no schema XSD cancNFe_v2.00.xsd e consSitNFe_v4.00.xsd? Preciso saber especificamente: (1) a estrutura completa do XML de cancelamento com todas as tags obrigatórias, (2) os tamanhos máximos e formatos dos campos de justificativa e protocolo, (3) as regras de validação do schema para o campo nProt (número do protocolo de autorização), e (4) qual a diferença entre os campos obrigatórios na versão 2.00 e 4.00 dos schemas de consulta de situação?",
    "context": "Estou desenvolvendo um sistema de emissão de NF-e e preciso implementar a funcionalidade de cancelamento com validação completa conforme os schemas XSD oficiais."
  }'
```

### Exemplo 2: Consulta sobre Estrutura XML e Regras de Validação

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Quais são as regras de preenchimento e validação para campos numéricos na NF-e conforme o manual de leiaute? Especificamente: (1) como devo tratar zeros não significativos em campos numéricos que representam valores e quantidades, (2) qual o tamanho máximo permitido para o campo cProd (código do produto) e se ele aceita valores decimais, (3) quais campos numéricos devem ser informados com tamanho fixo e preenchimento de zeros à esquerda, e (4) existe alguma diferença nas regras de validação entre campos numéricos que representam códigos (como CNPJ, CPF, CEP, CST, NCM) versus campos que representam valores monetários?",
    "context": "Preciso garantir que meu sistema está gerando XMLs válidos conforme as especificações oficiais da NF-e."
  }'
```

### Exemplo 3: Consulta Técnica sobre Web Services e Consultas

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Ao implementar a consulta de recibo de autorização (consReciNFe) e consulta de status do serviço (consStatServ), preciso entender: (1) qual a estrutura completa do XML de requisição para consReciNFe_v4.00.xsd incluindo todos os namespaces e atributos obrigatórios, (2) quais são os possíveis valores de retorno no campo cStat (código de status) do consStatServ e o que cada código significa, (3) qual o formato e tamanho do campo nRec (número do recibo) no consReciNFe, e (4) existe alguma diferença na estrutura do XML entre consultar um recibo de autorização versus consultar a situação de uma NF-e já autorizada?",
    "context": "Implementando integração com web services SEFAZ para consultas de NF-e."
  }'
```

### Exemplo 4: Query Mais Simples para Teste Inicial

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Qual o tamanho máximo do campo cProd na NF-e e quais são as regras de validação para este campo?",
    "context": "Estou implementando emissão de NF-e"
  }'
```

## Como Testar

1. **Inicie o servidor**:
   ```bash
   cd tax-virtual-office
   npm run build
   npm start
   ```

2. **Execute uma das queries acima** usando `curl` ou qualquer cliente HTTP

3. **Verifique os logs** para ver:
   - Se o vector store foi encontrado
   - Se a busca foi executada
   - Quantos resultados foram retornados
   - Se houve erros

4. **Analise a resposta**:
   - Deve conter informações dos schemas XSD
   - Deve referenciar os arquivos encontrados
   - Deve ter uma resposta coerente baseada nos documentos

## Observações

- As queries mais complexas (1, 2, 3) testam a capacidade de buscar informações específicas em múltiplos documentos
- A query 4 é mais simples e serve para teste inicial
- Todas as queries devem acionar o `file-search` tool automaticamente
- O agente `specialist-nfe` será acionado automaticamente devido às palavras-chave "NF-e", "cancelamento", "schema", etc.









