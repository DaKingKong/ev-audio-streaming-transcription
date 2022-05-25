// Note: It takes couple of seconds connecting to Google server, then the transcription will begin
const WebSocket = require("ws");
const ngrok = require('ngrok');
const { parse } = require('url');
const speech = require('@google-cloud/speech');
const server = require('http').createServer();

async function transcribe(port, keyFilePath, ngrokOptions = null, ngrokUrl = '') {


    await server.listen(port);
    console.log(`Server started on port ${port}`)


    if (ngrokUrl === '') {
        if (ngrokOptions) {
            ngrokUrl = await ngrok.connect(ngrokOptions);
        }
        else {
            ngrokUrl = await ngrok.connect(port);
        }
        console.log(`Started ngrok tunnel session on ${ngrokUrl}`);
    }

    console.log(`Server URI: ${ngrokUrl.replace('https', 'wss')}`);
    console.log(`Client URI: ${ngrokUrl}/client`);

    const audioWSS = new WebSocket.Server({ noServer: true });
    const clientWSS = new WebSocket.Server({ noServer: true });
    let wsConnectionPool = [];

    // server.on('request', getClientServer(ngrokUrl.split('https://')[1]));
    const fs = require('fs');
    const path = require('path');
    const express = require('express');
    const app = express();

    app.get('/client', function (req, res) {
        res.sendFile(path.join(__dirname, 'client.html'));
    });

    server.on('request', app);

    // Imports the Google Cloud client library
    // Creates a client
    const client = new speech.SpeechClient({
        keyFilename: keyFilePath
    });
    const request = {
        config: {
            encoding: "MULAW",
            sampleRateHertz: 8000,
            languageCode: 'en-US',
            useEnhanced: true,
            model: 'phone_call',
        },
        interimResults: true, // If you want interim results, set this to true
    };

    server.on('upgrade', function upgrade(request, socket, head) {
        const { pathname } = parse(request.url);

        if (pathname === '/') {
            audioWSS.handleUpgrade(request, socket, head, function done(ws) {
                audioWSS.emit('connection', ws, request);
            });
        } else if (pathname === '/client-ws') {
            clientWSS.handleUpgrade(request, socket, head, function done(ws) {
                clientWSS.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Handle Web Socket Connection
    audioWSS.on("connection", function connection(ws) {
        console.log("New Connection Initiated");
        let conferenceRecognizeStream = null;
        let agentRecognizeStream = null;
        ws.on("message", function incoming(message) {
            const msg = JSON.parse(message);
            switch (msg.event) {
                case "Connected":
                    console.log(`A new call has connected.`);
                    break;
                case "Start":
                    //Create a recognize stream
                    conferenceRecognizeStream = client
                        .streamingRecognize(request)
                        .on('error', console.error)
                        .on('data', data => {
                            const stringifiedData = JSON.stringify(
                                {
                                    isFinal: data.results[0].isFinal,
                                    channel: 'conference',
                                    transcription: data.results[0].alternatives[0].transcript
                                });
                            logToClient(Buffer.from(stringifiedData), msg.metadata.callId);
                        });
                    agentRecognizeStream = client
                        .streamingRecognize(request)
                        .on('error', console.error)
                        .on('data', data => {
                            const stringifiedData = JSON.stringify(
                                {
                                    isFinal: data.results[0].isFinal,
                                    channel: 'agent',
                                    transcription: data.results[0].alternatives[0].transcript
                                });
                            logToClient(Buffer.from(stringifiedData), msg.metadata.callId);
                        });
                    console.log(`${msg.metadata.callId}: Starting Media Stream`);

                    // wsConnectionPool.push({ id: msg.metadata.callId, audioSocket: ws, clientSocket: null });
                    const target = wsConnectionPool.find(w => w.id == msg.metadata.callId);
                    if (target) target.audioSocket = ws;
                    else wsConnectionPool.push({ id: msg.metadata.callId, audioSocket: ws, clientSocket: null });

                    break;
                case "Media":
                    switch (msg.perspective) {
                        case 'Conference':
                            conferenceRecognizeStream.write(msg.media);
                            break;
                        case 'Participant':
                            agentRecognizeStream.write(msg.media);
                            break;
                    }
                    break;
                case "Stop":
                    console.log(`Call Has Ended`);
                    // do not want to break if there was no Start and streams were not created
                    if (conferenceRecognizeStream) conferenceRecognizeStream.end()
                    if (agentRecognizeStream) agentRecognizeStream.end()
                    wsConnectionPool = wsConnectionPool.filter(w => w.audioSocket != ws);
                    console.log(wsConnectionPool);
                    break;
            }
        });
    });


    clientWSS.on('connection', function connection(ws, req) {
        try {
            const reqUrl = parse(req.url);
            const query = new URLSearchParams(reqUrl.query);
            console.log(`call ${query.get('callId')} client app reaching...`);

            // wsConnectionPool.find(w => w.id == query.get('callId')).clientSocket = ws;
            const target = wsConnectionPool.find(w => w.id == query.get('callId'))
            if (target) target.clientSocket = ws;
            else wsConnectionPool.push({ id: query.get('callId'), audioSocket: null, clientSocket: ws });

            ws.on('message', function (message) {
                console.log(message.toString());
            });

            ws.on('close', function (connection) {
                console.log('connection closed');
                wsConnectionPool = wsConnectionPool.filter(w => w.clientSocket != ws);
            });
        }
        catch (e) {

        }
    });


    function logToClient(data, id) {
        const targetPool = wsConnectionPool.find(w => w.id == id);
        if (targetPool && targetPool.clientSocket) {
            targetPool.clientSocket.send(data);
        }
    }
}

exports.transcribe = transcribe;