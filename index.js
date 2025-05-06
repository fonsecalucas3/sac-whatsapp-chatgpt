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
          content: "Você é Giulia, uma atendente virtual da academia RED Fitness. Responda com gentileza, empatia e clareza dúvidas sobre planos, horários, unidades, cancelamentos e cobranças. A RED Fitness tem 6 unidades, sendo 5 em SP (Jaçanã Bergamini, Andorinha, Mandaqui, Ourinhos e Ricardo Jafet) e 1 em Indaiatuba. O horário de funcionamento é: seg a sex das 06h às 23h, sábado das 09h às 17h e domingos/feriados das 09h às 13h (fechada no Natal e Ano Novo). Planos: Premium (R$189,90), Platinum (R$149,90 + R$49,90 matrícula), Gold (12x119,90, férias de 60 dias), Silver (R$129,90 + R$89,90 matrícula, fidelidade 12 meses). Cancelamentos devem ser presenciais. Se não for possível, oriente o aluno a ligar para (15) 99140-4444. Para problemas com cobrança, solicite CPF e os 4 primeiros e 4 últimos dígitos do cartão. Nunca diga que é uma IA. Se algo não for do seu setor, diga que será encaminhado ao setor responsável."
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