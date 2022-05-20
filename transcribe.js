// Note: It takes couple of seconds connecting to Google server, then the transcription will begin
const WebSocket = require("ws");
const speech = require('@google-cloud/speech');
const webPageClient = require('./client');

async function transcribe(keyFilePath) {
    const wss = new WebSocket.Server({
        port: 3333
    });
    console.log(`Server started on port: ${wss.address().port}`);

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

    // Handle Web Socket Connection
    wss.on("connection", function connection(ws) {
        console.log("New Connection Initiated");
        //Create a recognize stream
        const conferenceRecognizeStream = client
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', data => {
                const stringifiedData = JSON.stringify(
                    {
                        isFinal: data.results[0].isFinal,
                        channel: 'conference',
                        transcription: data.results[0].alternatives[0].transcript
                    });
                webPageClient.logToClient(Buffer.from(stringifiedData));
            });
        const agentRecognizeStream = client
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', data => {
                const stringifiedData = JSON.stringify(
                    {
                        isFinal: data.results[0].isFinal,
                        channel: 'agent',
                        transcription: data.results[0].alternatives[0].transcript
                    });
                webPageClient.logToClient(Buffer.from(stringifiedData));
            });

        ws.on("message", function incoming(message) {
            const msg = JSON.parse(message);
            switch (msg.event) {
                case "Connected":
                    console.log(`A new call has connected.`);
                    const conferenceCallStartedMessage = JSON.stringify(
                        {
                            isFinal: true,
                            channel: 'conference',
                            transcription: 'conversation started.'
                        });
                    const agentCallStartedMessage = JSON.stringify(
                        {
                            isFinal: true,
                            channel: 'agent',
                            transcription: 'conversation started.'
                        });
                    webPageClient.logToClient(Buffer.from(conferenceCallStartedMessage));
                    webPageClient.logToClient(Buffer.from(agentCallStartedMessage));
                    break;
                case "Start":
                    console.log('Starting Media Stream');
                    callId = msg.metadata.callId;
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
                    const conferenceCallEndedMessage = JSON.stringify(
                        {
                            isFinal: true,
                            channel: 'conference',
                            transcription: 'Call ended. Please refresh this page for next call.'
                        });
                    const agentCallEndedMessage = JSON.stringify(
                        {
                            isFinal: true,
                            channel: 'agent',
                            transcription: 'Call ended. Please refresh this page for next call.'
                        });
                    webPageClient.logToClient(Buffer.from(conferenceCallEndedMessage));
                    webPageClient.logToClient(Buffer.from(agentCallEndedMessage));
                    conferenceRecognizeStream.end()
                    agentRecognizeStream.end()
                    break;
            }
        });
    });
}

exports.transcribe = transcribe;