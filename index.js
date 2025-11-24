const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();
app.use(bodyParser.json());

let clients = {};  // deviceId => websocket connection

// Start server
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => {
  console.log("Money Alert Server Running on Port:", PORT);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New device connected.");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "register") {
        clients[data.deviceId] = ws;
        console.log("Device Registered:", data.deviceId);
      }
    } catch (e) {
      console.log("Invalid WS Message:", e);
    }
  });

  ws.on("close", () => {
    for (let id in clients) {
      if (clients[id] === ws) {
        delete clients[id];
        console.log("Device Disconnected:", id);
      }
    }
  });
});

// POST API — when Android detects payment
app.post("/event", (req, res) => {
  const { deviceId, amount, title, text } = req.body;

  console.log("Payment event from:", deviceId);

  if (clients[deviceId]) {
    clients[deviceId].send(
      JSON.stringify({
        type: "payment",
        amount,
        title,
        text
      })
    );
    console.log("Payment sent to device:", deviceId);
  } else {
    console.log("Device not connected:", deviceId);
  }

  res.send({ ok: true });
});
