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

// fill in value with your {portNumber} and {keyFilePath}. eg. runServer(8000, './cred.json')
runServer({portNumber}, {keyFilePath});
```

And then run `node server.js` and you'll see:

```bash
Server started on: wss://xxxx.ngrok.io  // this is your {streamingUrl}
Client started on: https://xxxx.ngrok.io/client  // this is your {agentScriptUrl}
```

3. Create a streaming profile by HTTP POST to `https://engage.ringcentral.com/platform/api/media/product` with body:
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

4. Create an Agent Script:
   - Log in to Engage Voice -> Admin
   - Agent Tools -> Script Designer -> (optional) Create a new group if needed
   - Add a new script -> In Queue/Campaign Assignments, tick on your Queue/Campaign -> Save
   - Open Script Studio -> From left panel, drag a Javascript and a Page component into the view -> Connect as from Start ---> Javascript ---> Page ---> End
   - Hover on Javascript and Edit, paste below code and save.
```javascript
async function waitForSeconds(sec){
   await sleep(sec * 1000);
   return goTo("page_0");
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
  
waitForSeconds(5);
```
   - Hover on Page and Edit -> Add "iFrame" element and adjust the size -> Edit element and fill Resource Url with `{agentScriptUrl}` with `?callId={{model.call.uii}}`. so `https://xxxx.ngrok.io/client?callId={{model.call.uii}}` -> Save

5. Now we are all set. Call the number of your Queue and transcriptions should come up.

### Additional Notes
- This package only supports local debugging environment at the moment. Deployment support is WIP.