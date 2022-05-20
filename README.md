# Engage Voice Audio Streaming Quick Test Package

This package is to test basic functionality of Engage Voice Audio Streaming feature by using [Google Cloud Speech-To-Text Service](https://cloud.google.com/speech-to-text)

## Getting Started

### 1. Enable Google Cloud Speech-To-Text Service

- [Google Cloud Account](https://cloud.google.com/)
- [Enable Google Speech To Text Service](https://console.cloud.google.com/speech/overview)
- [Google Service Account](https://cloud.google.com/docs/authentication/getting-started)

After above steps, you will get a JSON key file in your local drive. Copy the path(including file name) as `{keyFilePath}`.

### 2. Install and Use This Package

1. Create a new folder and do:

`npm init`

`npm i ev-audio-streaming-transcription`

2. Create a new file `server.js` with code below in it:

```
const { default: runServer } = require('ev-audio-streaming-transcription');

// fill in value with your {keyFilePath}
runServer({keyFilePath});
```

3. Using 2 web tunnels (ngrok + localtunnel)

    - Install:
      - `npm i ngrok -g`
      - `npm i localtunnel -g`
    - Run:
      - Open a terminal and run `ngrok http 3333`, you'll get `https://xxxx.ngrok.io`. Then note down `wss://xxxx.ngrok.io` as `{streamingUrl}`.
      - Open another terminal and run `lt -p 3334`, you'll get `https://xxx.lt`. Then note down `https://xxx.lt/client` as `{clientUrl}`.
      - There's an extra step to do for client side. On browser, open `https://xxx.lt/client` and press `Click to Continue`.

4. We now have 3 ports open:
   1. `port 3333` (`{streamingUrl}`). It is a WebSocket server that's receiving audio stream from Media Distributor and transcribe it with Google Speech-To-Text service.
   2. `port 3334` (`{clientUrl}`). It is an express server that hosts client html file.
   3. `port 3335`. It is another WebSocket server that pushes transcribed texts to client webpage.

5. Create a streaming profile by HTTP POST to `https://engage.ringcentral.com/platform/api/media/product` with body:
   ```json
    {
        "productType": {productType}, //QUEUE or CAMPAIGN
        "productId": {productId}, //queueId or campaignId
        "subAccountId": {subAccountId},
        "mainAccountId": {mainAccountId},
        "rcAccountId": {rcAccountId},
        "streamingUrl": {streamingUrl},
        "secret": {secret} // optional
    }
   ```

6. Create an Agent Script:
   - Log in to Engage Voice -> Admin
   - Agent Tools -> Script Designer -> (optional) Create a new group if needed
   - Add a new script -> In Queue/Campaign Assignments, tick on your Queue/Campaign -> Save
   - Open Script Studio -> From left panel, drag Page component into the view -> Connect Start to Page and Page to End
   - Hover on Page and Edit -> Add "iFrame" element and adjust the size -> Edit element and fill Resource Url with `{clientUrl}` -> Save

7. Now we are all set. Call the number of your Queue and transcriptions should come up.

### Additional Notes
- `localtunnel` isn't very stable. It'd crash sometimes. If that happens, we'll have to `lt -p 3334` again and change agent script as well.
- This package only supports local debugging environment at the moment. Deployment support is WIP.
- This package only supports 1 connection.