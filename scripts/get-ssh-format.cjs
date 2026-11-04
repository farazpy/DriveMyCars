const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const privateKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');

try {
    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8');
    const publicKey = crypto.createPublicKey(privateKeyPem);
    
    // In Node 10+, this outputs standard one-line ssh-rsa format
    const opensshFormat = publicKey.export({ type: 'pkcs1', format: 'ssh' }).toString().trim();

    console.log('\n--- USE THIS ONE-LINE KEY IN authorized_keys ---');
    console.log(opensshFormat);
    console.log('-----------------------------------------------\n');
} catch (err) {
    console.error('Error formatting key:', err.message);
    
    // Fallback: Just give them the PEM again if export fails
    console.log('\n--- FALLBACK (PEM FORMAT) ---');
    console.log(fs.readFileSync(privateKeyPath + '.pub', 'utf8'));
}
