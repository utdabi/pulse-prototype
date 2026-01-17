// Test script for the ingestion endpoint
const fs = require('fs');

async function testTextOnly() {
  console.log('Test 1: Text only (no image)');
  const formData = new FormData();
  formData.append('source', 'api');
  formData.append('content', 'The app crashes when I try to submit the form!');

  const response = await fetch('http://127.0.0.1:8787/api/feedback', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('---\n');
}

async function testWithImage() {
  console.log('Test 2: Text + image');
  const formData = new FormData();
  formData.append('source', 'web');
  formData.append('content', 'The button is slightly misaligned on the homepage');
  
  // Read the test image
  const imageBuffer = fs.readFileSync('./test-image.png');
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'test-image.png');

  const response = await fetch('http://127.0.0.1:8787/api/feedback', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  console.log('---\n');
}

async function runTests() {
  try {
    await testTextOnly();
    await testWithImage();
    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
