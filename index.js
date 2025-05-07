const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Novo: aceita qualquer tipo de body como texto
app.use(express.text({ type: "*/*" }));

// Novo: tenta forçar parsing do body em JSON
app.use((req, res, next) => {
  try {
    if (typeof req.body === 'string') {
      req.body = JSON.parse(req.body);
    }
  } catch (e) {
    console.log("Erro ao tentar parsear body como JSON:", e.message);
  }
  next();
});

const GPT_URL = 'https://api.openai.com/v1/chat/completions';
const ZAPI_URL = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-message`;

app.post('/webhook', async (req, res) => {
  console.log("Mensagem recebida do Z-API:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("Chaves do corpo:", Object.keys(req.body));

  const textoBruto = req.body['texto'];
  const telefoneBruto = req.body['telefone'];

  console.log("Tipo de texto:", typeof textoBruto);
  console.log("Valor de texto:", textoBruto);
  console.log("Valor de telefone:", telefoneBruto);

  let mensagem = null;
  if (typeof textoBruto === 'object' && textoBruto !== null) {
    mensagem = textoBruto['mensagem'] || textoBruto['message'] || textoBruto['Mensagem'] || null;
  } else if (typeof textoBruto === 'string') {
    try {
      const textoConvertido = JSON.parse(textoBruto);
      mensagem = textoConvertido['mensagem'] || textoConvertido['message'] || textoConvertido['Mensagem'] || null;
    } catch (e) {
      console.log("Erro ao converter texto para objeto:", e.message);
    }
  }

  const numero = telefoneBruto || req.body['participantPhone'] || req.body['from'] || req.body['chatId'] || null;

  console.log("Mensagem extraída:", mensagem);
  console.log("Telefone extraído:", numero);

  if (!mensagem || !numero) {
    console.log("Mensagem ou número ausente!");
    return res.sendStatus(400);
  }

  try {
    const gptResponse = await axios.post(GPT_URL, {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Você é Giulia, atendente virtual da academia RED Fitness. Seu tom é humano, educado, empático e prestativo.

Informações da academia:
- Unidades: 6 (5 em SP: Jaçanã Bergamini, Andorinha, Mandaqui, Ourinhos, Ricardo Jafet / 1 em Indaiatuba)
- Horário: Seg-Sex 06h-23h | Sáb 09h-17h | Dom/Feriados 09h-13h | Fechada no Natal e Ano Novo

Planos:
1. Premium – R$189,90/mês (mensal, sem taxa, acesso total, cancelamento automático em 30 dias)
2. Platinum – R$149,90/mês (cartão, sem fidelidade, matrícula R$49,90, acesso total)
3. Gold – R$119,90/mês (anual, acesso a 1 unidade, 60 dias de férias, sem taxa, R$1438,80 total)
4. Silver – R$129,90/mês (anual, fidelidade, sem férias, matrícula R$89,90, acesso a 1 unidade)

Cancelamentos:
- Devem ser feitos presencialmente.
- Se não puder ir, entre em contato com o financeiro: (15) 99140-4444
- Planos anuais: multa de 30% sobre os meses restantes.

Matrículas: www.redfitness.com.br

Cobrança indevida:
- Solicite CPF e os 4 primeiros e 4 últimos dígitos do cartão.
- Informe que será verificado e o valor estornado, se aplicável.

Reclamações:
- Seja empática, informe que esse não é o padrão da RED Fitness.
- Diga que o caso será levado à supervisão.

Atualizações: Instagram @redfitness

Nunca diga que é uma IA. Diga que encaminhará para o setor responsável quando necessário.`
        },
        {
          role: "user",
          content: mensagem
        }
      ]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const reply = gptResponse.data.choices[0].message.content;

    await axios.post(ZAPI_URL, {
      phone: numero,
      message: reply
    });

    console.log("Resposta enviada para o número:", numero);
    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no atendimento:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('SAC rodando...'));