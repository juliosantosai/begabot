const express = require('express');
const app = express();
app.use(express.json());

app.post('/run', (req, res) => {
  const { tenantId, prompt, history, context } = req.body || {};
  // Return a predictable parsedResponse with a memory_patch
  const parsed = {
    reply: `Mock reply to: ${String(prompt || '').slice(0, 40)}`,
    memory_patch: {
      ciudad: 'MVD',
      conversation_state: 'ESPERANDO_DIRECCION'
    }
  };

  const response = {
    status: 'success',
    response: parsed.reply,
    responseText: JSON.stringify(parsed),
    parsedResponse: parsed,
    output: { response: parsed.reply, parsedResponse: parsed }
  };

  res.json(response);
});

const port = process.env.MOCK_AI_PORT || 3003;
app.listen(port, () => console.log(`Mock AI server running on port ${port}`));
