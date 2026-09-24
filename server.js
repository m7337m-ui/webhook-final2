const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg ||!msg.text) return;
    const from = msg.from;
    const text = msg.text.body;
    console.log("من: " + from + " رسالة: " + text);

    const aiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.3-70b-versatile",
      messages: [
        {role:"system", content:"انت مساعد واتساب ذكي سعودي، ترد بلهجة بيضاء مختصرة وودودة."},
        {role:"user", content: text}
      ]
    }, {headers:{Authorization:`Bearer ${GROQ_API_KEY}`}});

    const reply = aiRes.data.choices[0].message.content;

    await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      messaging_product:"whatsapp",
      to: from,
      text: {body: reply}
    }, {headers:{Authorization:`Bearer ${WHATSAPP_TOKEN}`}});

  } catch(e){ console.log(e.response?.data || e.message) }
});

app.get('/', (req,res)=> res.send('BOT LIVE'));
app.listen(process.env.PORT || 3000, ()=> console.log('Live'));
