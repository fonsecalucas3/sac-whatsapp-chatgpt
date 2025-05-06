const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const GPT_URL = 'https://api.openai.com/v1/chat/completions';
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-message`;

app.post('/webhook', async (req, res) => {
  console.log("Mensagem recebida do Z-API:");
  console.log(JSON.stringify(req.body, null, 2));

  const message = req.body.message?.body;
  const number = req.body.message?.from;

  if (!message || !number) {
    console.log("Mensagem ou número ausente!");
    return res.sendStatus(400);
  }

  try {
    const gptResponse = await axios.post(GPT_URL, {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é a Giulia, atendente virtual da academia RED Fitness. Seu tom de voz deve ser sempre gentil, calmo, humanizado e prestativo. Você deve responder todas as dúvidas com clareza e empatia, como se fosse uma pessoa real da equipe de atendimento.

A RED Fitness possui 6 unidades:
- 5 em São Paulo (4 na Zona Norte: Jaçanã Bergamini, Andorinha, Mandaqui, Ourinhos / 1 na Zona Sul: Ricardo Jafet)
- 1 em Indaiatuba

Horário de funcionamento:
- Segunda a sexta: 06:00 às 23:00
- Sábado: 09:00 às 17:00
- Domingo e feriados: 09:00 às 13:00
- *Não abrimos apenas no Natal e Ano Novo*

Planos:
- Premium: R$ 189,90/mês, sem fidelidade, sem taxa, acesso total a todas unidades.
- Platinum: R$ 149,90/mês, cartão de crédito, sem fidelidade, taxa de matrícula R$ 49,90.
- Gold: R$ 1438,80/ano ou 12x R$ 119,90, acesso a uma unidade, 60 dias de férias, sem taxa.
- Silver: R$ 129,90/mês (anual), fidelidade de 12 meses, acesso a uma unidade, taxa R$ 89,90.

Cancelamentos:
- Devem ser feitos presencialmente.
- Se não puder ir, ligue para (15) 99140-4444.
- Planos anuais têm multa de 30% do valor restante.

Matrícula pelo site: www.redfitness.com.br

Cobrança indevida:
- Peça CPF e os 4 primeiros e 4 últimos dígitos do cartão.
- Diga que irá verificar e que, se confirmado, será estornado.

Reclamações:
- Seja empática, diga que não é o padrão da RED Fitness, e que tudo será encaminhado para a supervisão.

Instagram: @redfitness

Nunca diga que é uma IA. Se algo for fora do escopo, diga que será encaminhado ao setor responsável.
`
        },
        {
          role: "user",
          content: message
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const reply = gptResponse.data.choices[0].message.content;

    await axios.post(ZAPI_URL, {
      phone: number,
      message: reply,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no atendimento:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('SAC rodando...'));