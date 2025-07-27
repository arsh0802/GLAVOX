// const { PollyClient } = require('@aws-sdk/client-polly');

// const polly = new PollyClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY
//   }
// });

// module.exports = polly;
const { PollyClient } = require('@aws-sdk/client-polly');
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { fromEnv } = require("@aws-sdk/credential-provider-env");

const polly = new PollyClient({
  region: 'us-east-1', // ya jo bhi region ho
  credentials: fromEnv(), // use env variables
});

module.exports = polly;
