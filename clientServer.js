const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');

function getClientServer(domainUrl) {
    app.get('/client', function (req, res) {
        const fileBuffer = fs.readFileSync(path.join(__dirname, 'client.html'));
        let fileString = fileBuffer.toString();
        const wssUrl = `wss://${domainUrl}/client-ws?callId=${req.query.callId}`;
        fileString = fileString.replace('[wsServerUrl]', wssUrl)
        res.send(fileString);
    });
    return app;
}

module.exports = getClientServer;