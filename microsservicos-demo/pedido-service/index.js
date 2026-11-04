const express = require('express');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const PRODUTO_SERVICE_URL = process.env.PRODUTO_SERVICE_URL || 'http://localhost:3001';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 1500;

app.use(express.json());

const pedidosDB = [];
let proximoId = 1;

app.get('/pedidos', (req, res) => {
  console.log('[Serviço de Pedidos] Acessando o banco de dados local...');
  res.json({
    servico: 'Serviço de Pedidos',
    status: 'Saudável',
    dados: pedidosDB
  });
});

app.get('/pedidos/:id', (req, res) => {
  const pedido = pedidosDB.find((p) => p.id === Number(req.params.id));

  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado.' });
  }

  res.json(pedido);
});

app.post('/pedidos', async (req, res) => {
  const { produtoId, quantidade } = req.body ?? {};

  if (!Number.isInteger(produtoId) || !Number.isInteger(quantidade) || quantidade <= 0) {
    return res.status(400).json({
      erro: 'Informe produtoId e quantidade como números inteiros (quantidade maior que zero).'
    });
  }

  let produto;

  try {
    console.log(`[Serviço de Pedidos] Consultando o Serviço de Produtos (produto ${produtoId})...`);
    const resposta = await axios.get(`${PRODUTO_SERVICE_URL}/produtos/${produtoId}`, { timeout: TIMEOUT_MS });
    produto = resposta.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    console.error('[Serviço de Pedidos] Falha ao consultar o Serviço de Produtos:', error.message);
    return res.status(503).json({
      erro: 'Não foi possível validar o produto agora. Tente novamente mais tarde.'
    });
  }

  if (produto.estoque < quantidade) {
    return res.status(409).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque}.` });
  }

  const pedido = {
    id: proximoId++,
    produtoId,
    nomeProduto: produto.nome,
    quantidade,
    total: produto.preco * quantidade,
    criadoEm: new Date().toISOString()
  };

  pedidosDB.push(pedido);
  console.log(`[Serviço de Pedidos] Pedido ${pedido.id} criado.`);
  res.status(201).json(pedido);
});

app.listen(PORT, () => {
  console.log(`[Serviço de Pedidos] Executando na porta ${PORT}`);
});
