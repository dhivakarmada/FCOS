const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = 'C:\\Users\\dhiva\\.gemini\\antigravity-ide\\brain\\4188662f-d539-4913-be20-3f27becf8805\\.system_generated\\logs\\transcript.jsonl';
const outputPath = 'C:\\Users\\dhiva\\.gemini\\antigravity-ide\\brain\\4188662f-d539-4913-be20-3f27becf8805\\scratch\\user_history.txt';

async function search() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outStream = fs.createWriteStream(outputPath);
  outStream.write('=== ALL PAST USER INPUTS ===\n');
  
  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT') {
        outStream.write(`\n[Line ${lineCount}] USER INPUT:\n`);
        outStream.write(obj.content + '\n');
        outStream.write('--------------------------------------------------\n');
      }
    } catch (err) {
      // ignore
    }
  }
  
  outStream.end();
  console.log('Finished writing user history to ' + outputPath);
}

search();
