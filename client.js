const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
app.listen(3334);
app.get('/client', function (req, res) {
    res.sendFile(path.join(__dirname, 'html/client.html'));
});
app.get('/style', function (req, res) {
    res.sendFile(path.join(__dirname, 'html/style.css'));
});

const wss = new WebSocket.Server({
    port: 3335
});

let ws = null;

wss.on('connection', function (webSocket) {
    ws = webSocket;
    webSocket.on('message', function (message) {
        console.log(message.toString());
    });

    webSocket.on('close', function (connection) {
        console.log('connection closed');
    });
});

function logToClient(data) {
    ws.send(data);
}

exports.logToClient = logToClient;