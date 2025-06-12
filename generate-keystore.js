// generate-keystore.js
const fs = require('fs');
const readline = require('readline');
const { Wallet } = require('ethers');

async function prompt(query, hide = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });
  if (hide) {
    process.stdin.on('data', char => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdout.write('\n');
          break;
        default:
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(query + Array(rl.line.length + 1).join('*'));
          break;
      }
    });
  }
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

(async () => {
  try {
    let privateKey = await prompt('Enter your private key (with or without 0x prefix): ');
    if (privateKey.startsWith('0x')) { privateKey = privateKey.slice(2); }
    if (privateKey.length !== 64) {
      throw new Error('Invalid private key format. (Expected 64 hex chars, or 66 with 0x.)');
    }
    const password = await prompt('Enter a password to encrypt your keystore: ', true);
    const wallet = new Wallet('0x' + privateKey);
    console.log('Encrypting wallet...');
    const keystoreJson = await wallet.encrypt(password);
    const fileName = `keystore-${wallet.address}.json`;
    fs.writeFileSync(fileName, keystoreJson);
    console.log(`Keystore saved to ${fileName}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
})(); 