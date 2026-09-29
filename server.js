const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

console.log("=== ENV CHECK ===");
console.log("VERIFY_TOKEN exists:",!!VERIFY_TOKEN);
console.log("WHATSAPP_TOKEN exists:",!!WHATSAPP_TOKEN);
console.log("PHONE_NUMBER_ID exists:",!!PHONE_NUMBER_ID);

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  console.log("GET /webhook RECEIVED", { mode, token });
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    console.log("VERIFY FAILED");
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  console.log("POST /webhook RECEIVED", JSON.stringify(req.body, null, 2));
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    if (message) {
      const from = message.from;
      const text = message.text?.body || "هلا";
      console.log(`Message from ${from}: ${text}`);
      await axios.post(
        `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: `تم الاستلام: ${text}` }
        },
        { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
      );
      console.log("Reply sent");
    }
  } catch (e) {
    console.error("Error:", e.response?.data || e.message);
  }
  res.sendStatus(200);
});

app.get('/', (req,res)=> res.send('Webhook Live'));
const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
