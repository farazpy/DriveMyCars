const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { utils } = require('ssh2');

const sshDir = path.join(os.homedir(), '.ssh');
if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true });
}

const privateKeyPath = path.join(sshDir, 'id_rsa');
const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

console.log('Generating new SSH key pair...');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem'
    }
});

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey); 

// Use ssh2 to convert to OpenSSH format
const parsed = utils.parseKey(privateKey);
const opensshPubKey = utils.genPublicKey(parsed).public.toString('utf8');

fs.writeFileSync(publicKeyPath + '.openssh', opensshPubKey);

console.log('✅ SSH key pair generated.');
console.log('\n--- PUBLIC KEY (Copy this to your VPS authorized_keys) ---');
console.log(opensshPubKey);
console.log('---------------------------------------------------------');
