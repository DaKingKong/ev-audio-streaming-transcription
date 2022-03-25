# Engage Voice Audio Streaming Quick Test Package

This package is to test basic functionality of Engage Voice Audio Streaming feature by using [Google Cloud Speech-To-Text Service](https://cloud.google.com/speech-to-text)

## Getting Started

### 1. Enable Google Cloud Speech-To-Text Service

- [Google Cloud Account](https://cloud.google.com/)
- [Enable Google Speech To Text Service](https://console.cloud.google.com/speech/overview)
- [Google Service Account](https://cloud.google.com/docs/authentication/getting-started)

After above steps, you will get a JSON key file in your local drive. Copy the path(including file name) as `keyFilePath`.

### 2. Install This Package

Create a new folder and do:

`npm init`
`npm i ev-audio-streaming-transcription`

then create a new file `server.js` with code below in it:

```
const { default: runServer } = require('ev-audio-streaming-transcription');

const port = 3333;
// fill in value with your keyFilePath
const keyFilePath = ;
runServer(port, keyFilePath);
```

then do:

`node server.js`

You'll get a WSS address to be uploaded to your streaming profile.