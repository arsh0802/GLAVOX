const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Function to convert audio to text using Web Speech API
const transcribeAudio = async (audioFilePath) => {
  try {
    console.log('🎤 Starting audio transcription...');
    console.log('📁 Processing audio file:', audioFilePath);

    // Convert audio file to a format that can be processed by the Web Speech API
    // First, convert to WAV format if needed
    const wavFilePath = audioFilePath.replace(/\.[^/.]+$/, '.wav');
    
    console.log('🔄 Converting audio to WAV format...');
    // Use ffmpeg to convert the audio file to WAV format
    await execPromise(`ffmpeg -i "${audioFilePath}" -acodec pcm_s16le -ar 16000 "${wavFilePath}"`);
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(wavFilePath);
    
    // Create a temporary HTML file with the Web Speech API implementation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audio Transcription</title>
        </head>
        <body>
          <script>
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              console.log(transcript);
              document.body.innerHTML = transcript;
            };
            
            recognition.onerror = (event) => {
              console.error('Speech recognition error:', event.error);
              document.body.innerHTML = 'Error: ' + event.error;
            };
            
            // Start recognition
            recognition.start();
          </script>
        </body>
      </html>
    `;
    
    const htmlFilePath = path.join(path.dirname(audioFilePath), 'transcribe.html');
    fs.writeFileSync(htmlFilePath, htmlContent);
    
    console.log('🤖 Starting speech recognition...');
    // Use a headless browser to run the Web Speech API
    const { stdout } = await execPromise(`node -e "
      const puppeteer = require('puppeteer');
      (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('file://${htmlFilePath}');
        
        // Wait for transcription to complete
        await page.waitForFunction(() => {
          return document.body.textContent !== '' && 
                 !document.body.textContent.includes('Error:');
        }, { timeout: 30000 });
        
        const transcript = await page.evaluate(() => document.body.textContent);
        console.log(transcript);
        await browser.close();
      })();
    "`);
    
    const transcribedText = stdout.trim();
    console.log('✅ Transcription complete!');
    console.log('📝 Transcribed text:', transcribedText);
    
    // Clean up temporary files
    fs.unlinkSync(wavFilePath);
    fs.unlinkSync(htmlFilePath);
    
    return transcribedText;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
};

module.exports = {
  transcribeAudio
}; 