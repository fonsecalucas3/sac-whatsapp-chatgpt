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

  const message = req.body.texto?.mensagem;
  const number = req.body.telefone;

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
          content: "Você é Giulia, uma atendente virtual da academia RED Fitness. Responda com gentileza, empatia e clareza dúvidas sobre planos, horários, unidades, cancelamentos e cobranças. A RED Fitness tem 6 unidades, sendo 5 em SP (Jaçanã Bergamini, Andorinha, Mandaqui, Ourinhos e Ricardo Jafet) e 1 em Indaiatuba. O horário de funcionamento é: seg a sex das 06h às 23h, sábado das 09h às 17h e domingos/feriados das 09h às 13h (fechada no Natal e Ano Novo). Planos: Premium (R$189,90), Platinum (R$149...
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
      message: reply
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no atendimento:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('SAC rodando...'));