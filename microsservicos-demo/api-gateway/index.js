const express = require('express');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 2000;

const SERVICOS = {
  produtos: {
    nome: 'Serviço de Produtos',
    url: process.env.PRODUTO_SERVICE_URL || 'http://localhost:3001'
  },
  pedidos: {
    nome: 'Serviço de Pedidos',
    url: process.env.PEDIDO_SERVICE_URL || 'http://localhost:3002'
  }
};

app.use(express.json());

async function encaminhar(req, res, servico, caminho) {
  console.log(`[API Gateway] Requisição ${req.method} ${req.originalUrl} recebida. Encaminhando para o ${servico.nome}...`);

  try {
    const resposta = await axios({
      method: req.method,
      url: `${servico.url}${caminho}`,
      data: req.body,
      timeout: TIMEOUT_MS
    });

    res.status(resposta.status).json({
      gateway: 'API Gateway ativo',
      encaminhadoPara: servico.nome,
      resultado: resposta.data
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        gateway: 'API Gateway ativo',
        encaminhadoPara: servico.nome,
        resultado: error.response.data
      });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error(`[API Gateway] ${servico.nome} não respondeu em ${TIMEOUT_MS} ms.`);
      return res.status(504).json({
        erro: `${servico.nome} demorou demais para responder. O timeout evitou que o gateway ficasse travado.`
      });
    }

    console.error(`[API Gateway] Erro de comunicação com o ${servico.nome}:`, error.message);
    res.status(503).json({
      erro: `${servico.nome} temporariamente indisponível. O isolamento evitou a queda total do sistema.`
    });
  }
}

app.get('/api/catalogo/produtos', (req, res) => encaminhar(req, res, SERVICOS.produtos, '/produtos'));

app.get('/api/catalogo/produtos/:id', (req, res) =>
  encaminhar(req, res, SERVICOS.produtos, `/produtos/${encodeURIComponent(req.params.id)}`)
);

app.get('/api/pedidos', (req, res) => encaminhar(req, res, SERVICOS.pedidos, '/pedidos'));

app.get('/api/pedidos/:id', (req, res) =>
  encaminhar(req, res, SERVICOS.pedidos, `/pedidos/${encodeURIComponent(req.params.id)}`)
);

app.post('/api/pedidos', (req, res) => encaminhar(req, res, SERVICOS.pedidos, '/pedidos'));

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada no API Gateway.' });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Ponto de entrada único executando na porta ${PORT}`);
});
