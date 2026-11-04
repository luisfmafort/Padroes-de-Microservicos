# Demonstração: Padrão de Microsserviços

Exemplo simples do padrão de Microsserviços com três processos independentes:

| Componente | Porta | Função |
|---|---|---|
| API Gateway | 3000 | Ponto de entrada único; recebe a requisição do cliente e encaminha para o serviço correto |
| Serviço de Produtos | 3001 | Catálogo de produtos, com seu próprio "banco" |
| Serviço de Pedidos | 3002 | Criação e listagem de pedidos, com seu próprio "banco"; consulta o Serviço de Produtos via HTTP |

> **Observação:** os "bancos de dados" são arrays em memória (simulação). Ao reiniciar um serviço, os dados dele voltam ao estado inicial.

## Estrutura de pastas

```
microsservicos-demo/
├── api-gateway/
│   └── index.js
├── produto-service/
│   └── index.js
├── pedido-service/
│   └── index.js
├── package.json
└── README.md
```

## Requisitos

- Node.js 18 ou superior

## Instalação

Na pasta raiz do projeto (só uma vez):

```
npm install
```

## Como subir

Abra **três terminais** na pasta raiz e rode um comando em cada:

```
npm run produtos
npm run pedidos
npm run gateway
```

## Rotas do API Gateway

| Método | Rota | Encaminha para |
|---|---|---|
| GET | `/api/catalogo/produtos` | Serviço de Produtos |
| GET | `/api/catalogo/produtos/:id` | Serviço de Produtos |
| GET | `/api/pedidos` | Serviço de Pedidos |
| GET | `/api/pedidos/:id` | Serviço de Pedidos |
| POST | `/api/pedidos` | Serviço de Pedidos (corpo: `{ "produtoId": 2, "quantidade": 3 }`) |

As rotas GET podem ser abertas direto no navegador, por exemplo `http://localhost:3000/api/catalogo/produtos`.

Para criar um pedido no **PowerShell**:

```
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/pedidos -ContentType "application/json" -Body '{"produtoId": 2, "quantidade": 3}'
```

No **Git Bash / Linux / macOS**:

```
curl -X POST http://localhost:3000/api/pedidos -H "Content-Type: application/json" -d '{"produtoId": 2, "quantidade": 3}'
```

## Roteiro da demonstração

1. **Funcionamento normal:** abrir `http://localhost:3000/api/catalogo/produtos` → **200** com a lista de produtos.
2. **Comunicação entre serviços:** criar um pedido (POST acima) → **201**. O Serviço de Pedidos consultou o Serviço de Produtos via HTTP para validar o produto e o estoque.
3. **Isolamento de falhas:** apertar `Ctrl+C` no terminal do Serviço de Produtos.
   - `GET /api/catalogo/produtos` → **503** (serviço indisponível)
   - `GET /api/pedidos` → **200** (o Serviço de Pedidos continua funcionando)
   - `POST /api/pedidos` → **503** (não dá para validar o produto sem o Serviço de Produtos)
4. **Timeout:** subir o Serviço de Produtos em modo lento (responde em 3 s):
   ```
   npm run produtos:lento
   ```
   - `GET /api/catalogo/produtos` → **504**. O gateway desiste depois de 2 s em vez de ficar travado esperando.

## Códigos de resposta do gateway

| Código | Quando acontece |
|---|---|
| 200 / 201 | Requisição atendida pelo serviço |
| 400 / 404 / 409 | Erro devolvido pelo próprio serviço (dados inválidos, item não encontrado, estoque insuficiente), repassado pelo gateway |
| 503 | O serviço está fora do ar |
| 504 | O serviço não respondeu dentro do tempo limite (2 s) |

## Configuração (opcional)

As URLs, portas e o tempo limite têm valores padrão, mas podem ser alterados por variáveis de ambiente:

| Variável | Padrão | Usada em |
|---|---|---|
| `PORT` | 3000 / 3001 / 3002 | Todos |
| `PRODUTO_SERVICE_URL` | `http://localhost:3001` | Gateway e Pedidos |
| `PEDIDO_SERVICE_URL` | `http://localhost:3002` | Gateway |
| `TIMEOUT_MS` | 2000 no gateway, 1500 em Pedidos | Gateway e Pedidos |

O timeout do Serviço de Pedidos é menor que o do gateway de propósito: assim, quando o Serviço de Produtos está lento, o Serviço de Pedidos responde com um erro claro antes de o gateway desistir dele.
