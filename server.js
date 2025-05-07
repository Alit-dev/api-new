// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


app.get('/sara/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/upload', express.static(path.join(__dirname, 'caches')));


const help = require('./api/help.js');
app.use('/help', help );
const waifuRoute = require('./api/waifu.js');
app.use('/wifu', waifuRoute);
app.use('/waifu', waifuRoute);
const geminiedit = require('./api/geminiedit.js');
app.use('/edit', geminiedit);
const downloader = require("./api/download.js");
app.use("/download", downloader);
const sara = require("./api/sara/main.js");
app.use("/sara", sara);
const googletts = require("./api/googletts.js");
app.use("/say", googletts);
const flux = require("./api/flux.js");
app.use("/flux", flux);
const geminiimg = require('./api/geminigen.js');
app.use('/geminigen', geminiimg );
const gemini = require('./api/chatai/gemini.js');
app.use('/gemini', gemini );
const singRouter = require('./api/sing.js');
app.use('/sing', singRouter);
const lalma = require('./api/chatai/lalma3.js');
app.use('/lalma3', lalma);
const deepsheek = require('./api/chatai/deepsheek.js');
app.use('/deepsheek', deepsheek );



app.get('/', (req, res) => {
  res.send('✅ Server is running...');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
