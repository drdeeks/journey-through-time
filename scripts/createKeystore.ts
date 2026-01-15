import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function questionHidden(query: string): Promise<string> {
  return new Promise(resolve => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    let input = '';
    const onData = (char: Buffer) => {
      const charStr = char.toString();
      
      if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(input);
      } else if (charStr === '\u0003') {
        process.exit();
      } else if (charStr === '\u007f') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += charStr;
        process.stdout.write('*');
      }
    };
    
    process.stdin.on('data', onData);
  });
}

async function main() {
  console.log('🔐 Keystore Generator\n');
  
  const choice = await question('Choose an option:\n1. Generate new wallet and keystore\n2. Import existing private key\nEnter choice (1 or 2): ');
  
  let wallet: ethers.HDNodeWallet | ethers.Wallet;
  
  if (choice === '1') {
    console.log('\nGenerating new wallet...');
    wallet = ethers.Wallet.createRandom();
    console.log(`✅ New wallet created!`);
    console.log(`Address: ${wallet.address}`);
    console.log(`⚠️  SAVE THIS PRIVATE KEY SECURELY: ${wallet.privateKey}\n`);
  } else if (choice === '2') {
    const privateKey = await questionHidden('Enter your private key (hidden): ');
    
    try {
      wallet = new ethers.Wallet(privateKey);
      console.log(`✅ Wallet imported successfully!`);
      console.log(`Address: ${wallet.address}\n`);
    } catch (error) {
      console.error('❌ Invalid private key format');
      process.exit(1);
    }
  } else {
    console.error('❌ Invalid choice');
    process.exit(1);
  }
  
  const password = await questionHidden('Enter password to encrypt keystore: ');
  const confirmPassword = await questionHidden('Confirm password: ');
  
  if (password !== confirmPassword) {
    console.error('❌ Passwords do not match');
    process.exit(1);
  }
  
  console.log('\nGenerating encrypted keystore...');
  
  try {
    const keystore = await wallet.encrypt(password);
    const keystorePath = path.join(process.cwd(), 'keystore.json');
    
    fs.writeFileSync(keystorePath, keystore);
    
    console.log(`✅ Keystore created successfully at: ${keystorePath}`);
    console.log('⚠️  Keep your password safe - it cannot be recovered!');
    console.log('⚠️  Add keystore.json to .gitignore to avoid committing it');
    
  } catch (error) {
    console.error('❌ Failed to create keystore:', error);
    process.exit(1);
  }
  
  rl.close();
}

main().catch(console.error);
