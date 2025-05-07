const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const GPT_URL = 'https://api.openai.com/v1/chat/completions';
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-message`;

app.post('/webhook', async (req, res) => {
  const body = req.body;

  console.log("Mensagem recebida do Z-API:\n", JSON.stringify(body, null, 2));

  const message = body.texto?.mensagem || body.texto?.message || null;
  const number = body.telefone || body.phone || null;

  console.log("Mensagem extraída:", message);
  console.log("Telefone extraído:", number);

  if (body.isGroup === true) {
    console.log("Mensagem de grupo ignorada.");
    return res.sendStatus(200);
  }

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
          content: "Você é Giulia, atendente virtual da academia RED Fitness. Responda com gentileza e empatia sobre planos, horários, unidades, cancelamentos, cobranças e demais dúvidas. Nunca diga que é uma IA."
        },
        {
          role: "user",
          content: message
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const reply = gptResponse.data.choices[0].message.content;

    await axios.post(ZAPI_URL, {
      phone: number,
      message: reply
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao processar a mensagem:", error);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("SAC rodando...");
});