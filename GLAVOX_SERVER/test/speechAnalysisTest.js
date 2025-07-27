const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testSpeechAnalysis() {
  try {
    // Test case 1: Simple sentence
    const test1 = await axios.post(`${API_URL}/analytics/test/speech-analysis`, {
      text: "Hello, how are you today? I am doing great!"
    });
    console.log('\nTest 1 - Simple sentence:');
    console.log(JSON.stringify(test1.data, null, 2));

    // Test case 2: Complex sentence with varied vocabulary
    const test2 = await axios.post(`${API_URL}/analytics/test/speech-analysis`, {
      text: "The magnificent architecture of the ancient cathedral stood majestically against the azure sky, while birds soared gracefully overhead."
    });
    console.log('\nTest 2 - Complex sentence:');
    console.log(JSON.stringify(test2.data, null, 2));

    // Test case 3: Multiple sentences with pauses
    const test3 = await axios.post(`${API_URL}/analytics/test/speech-analysis`, {
      text: "First sentence. Second sentence. Third sentence. Fourth sentence."
    });
    console.log('\nTest 3 - Multiple sentences:');
    console.log(JSON.stringify(test3.data, null, 2));

  } catch (error) {
    console.error('Error testing speech analysis:', error.response?.data || error.message);
  }
}

// Run the tests
testSpeechAnalysis(); 