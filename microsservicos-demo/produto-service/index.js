const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MODO_LENTO = process.argv.includes('--lento');
const ATRASO_MS = 3000;

app.use(express.json());

const produtosDB = [
  { id: 1, nome: 'Teclado Mecânico', preco: 250.0, estoque: 15 },
  { id: 2, nome: 'Mouse Gamer', preco: 150.0, estoque: 30 },
  { id: 3, nome: 'Monitor Ultrawide', preco: 1200.0, estoque: 5 }
];

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(async (req, res, next) => {
  if (MODO_LENTO) {
    console.log(`[Serviço de Produtos] Modo lento: aguardando ${ATRASO_MS} ms antes de responder...`);
    await esperar(ATRASO_MS);
  }
  next();
});

app.get('/produtos', (req, res) => {
  console.log('[Serviço de Produtos] Acessando o banco de dados local...');
  res.json({
    servico: 'Serviço de Produtos',
    status: 'Saudável',
    dados: produtosDB
  });
});

app.get('/produtos/:id', (req, res) => {
  const produto = produtosDB.find((p) => p.id === Number(req.params.id));

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }

  console.log(`[Serviço de Produtos] Produto ${produto.id} consultado.`);
  res.json(produto);
});

app.listen(PORT, () => {
  console.log(`[Serviço de Produtos] Executando na porta ${PORT}${MODO_LENTO ? ' (modo lento)' : ''}`);
});
