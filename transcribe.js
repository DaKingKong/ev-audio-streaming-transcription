// Note: It takes couple of seconds connecting to Google server, then the transcription will begin
const localtunnel = require('localtunnel');
const WebSocket = require("ws");
const speech = require('@google-cloud/speech');

async function transcribe(port, keyFilePath) {
    const wss = new WebSocket.Server({
        port
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
        },
        interimResults: false, // If you want interim results, set this to true
    };

    // Handle Web Socket Connection
    wss.on("connection", function connection(ws) {
        console.log("New Connection Initiated");
        //Create a recognize stream
        const recognizeStream = client
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', data =>
                process.stdout.write(
                    data.results[0] && data.results[0].alternatives[0]
                        ? `========\n Transcription: ${data.results[0].alternatives[0].transcript}\n    Confidence: ${data.results[0].alternatives[0].confidence}\n`
                        : '\n\nReached transcription time limit, press Ctrl+C\n'
                )
            );

        ws.on("message", function incoming(message) {
            const msg = JSON.parse(message);
            switch (msg.event) {
                case "Connected":
                    console.log(`A new call has connected.`);
                    console.log(msg);
                    break;
                case "Start":
                    console.log('Starting Media Stream');
                    callId = msg.metadata.callId;
                    break;
                case "Media":
                    switch (msg.perspective) {
                        // Here we only do client side transcription
                        case 'Conference':
                            recognizeStream.write(msg.media);
                            break;
                    }
                    break;
                case "Stop":
                    console.log(`Call Has Ended`);
                    recognizeStream.end()
                    break;
            }
        });
    });

    const tunnel = await localtunnel({ port: 3333 });
    console.log(`\nTunneled to:\nwss://${tunnel.url.split('://')[1]}`)
    tunnel.on('close', () => {
        // tunnels are closed
        console.warn('tunnel closed.')
    });
}

exports.default = transcribe;