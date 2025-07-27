const fs = require("fs");
const { PollyClient, SynthesizeSpeechCommand, Engine } = require("@aws-sdk/client-polly");

const pollyClient = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// 📢 Convert text to audio (SSML or plain)
const textToSpeech = async (text) => {
  const params = {
    Text: text,
    TextType: "ssml",
    OutputFormat: "mp3",
    VoiceId: "Joanna",
  };

  try {
    const { AudioStream } = await pollyClient.send(new SynthesizeSpeechCommand(params));
    return AudioStream;
  } catch (err) {
    console.error("❌ Polly textToSpeech Error:", err);
    throw err;
  }
};

// 🔊 Save AI response as MP3 and return file path
const speakWithPolly = async (text) => {
  try {
    const params = {
      Text: text,
      OutputFormat: "mp3",
      VoiceId: "Joanna",
    };

    const { AudioStream } = await pollyClient.send(new SynthesizeSpeechCommand(params));
    if (!AudioStream) return null;

    const filePath = "public/response.mp3";
    const writeStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      AudioStream.pipe(writeStream)
        .on("finish", () => resolve("/response.mp3"))
        .on("error", () => reject(null));
    });
  } catch (error) {
    console.error("❌ Polly speakWithPolly Error:", error.message);
    return null;
  }
};

module.exports = {
  speakWithPolly,
  textToSpeech,
};
