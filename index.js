const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const GPT_URL = 'https://api.openai.com/v1/chat/completions';
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-message`;

app.post('/webhook', async (req, res) => {
  console.log("Mensagem recebida do Z-API:
", req.body);

  const msg = req.body.texto?.mensagem || req.body.texto?.message || null;
  const number = req.body.telefone || req.body.participantPhone || null;

  console.log("Mensagem extraída:", msg);
  console.log("Telefone extraído:", number);

  if (!msg || !number) {
    console.log("Mensagem ou número ausente!");
    return res.sendStatus(400);
  }

  try {
    const gptResponse = await axios.post(GPT_URL, {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é Giulia, atendente virtual da academia RED Fitness. Fale com empatia e clareza sobre planos, horários, unidades, cancelamentos e cobranças. Siga a postura da academia e diga que repassará ao setor responsável se necessário."
        },
        { role: "user", content: msg }
      ],
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
    console.error("Erro no processamento:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('SAC rodando...'));