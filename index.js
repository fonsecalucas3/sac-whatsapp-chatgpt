const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const GPT_URL = 'https://api.openai.com/v1/chat/completions';
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-message`;

app.post('/webhook', async (req, res) => {
  console.log("Mensagem recebida do Z-API:
", JSON.stringify(req.body, null, 2));

  const keys = Object.keys(req.body);
  console.log("Chaves do req.body:", keys);

  const rawText = req.body.texto;
  const rawPhone = req.body.telefone;

  console.log("Campo 'texto':", rawText);
  console.log("Campo 'telefone':", rawPhone);

  const message = rawText?.mensagem || rawText?.message;
  const number = rawPhone;

  console.log("Mensagem extraída:", message);
  console.log("Telefone extraído:", number);

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
          content: "Você é Giulia, uma atendente virtual da academia RED Fitness. Responda de forma gentil, clara e empática."
        },
        { role: "user", content: message }
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
    console.error("Erro ao processar mensagem:", err);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('SAC rodando...'));