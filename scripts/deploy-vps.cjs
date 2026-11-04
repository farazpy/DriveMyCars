const SftpClient = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function deploy() {
  const sftp = new SftpClient();
  
  const config = {
    host: process.env.DEPLOY_HOST,
    username: process.env.DEPLOY_USER,
    privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_rsa')),
    // If private key fails, user can use password in secrets:
    // password: process.env.DEPLOY_PASSWORD
  };

  if (!config.host || !config.username) {
    console.error('❌ DEPLOY_HOST and DEPLOY_USER must be set in Secrets.');
    process.exit(1);
  }

  const remotePath = process.env.DEPLOY_PATH;
  if (!remotePath) {
    console.error('❌ DEPLOY_PATH must be set in Secrets.');
    process.exit(1);
  }

  try {
    console.log(`🚀 Connecting to ${config.host}...`);
    await sftp.connect(config);
    console.log('✅ Connected.');

    const localDist = path.join(process.cwd(), 'dist');
    const remoteDist = path.join(remotePath, 'dist');

    console.log('📤 Uploading frontend build (dist)...');
    await sftp.uploadDir(localDist, remoteDist);
    
    console.log('📤 Uploading server files...');
    await sftp.uploadDir(path.join(process.cwd(), 'server'), path.join(remotePath, 'server'));
    
    console.log('📤 Uploading configuration files...');
    await sftp.put(path.join(process.cwd(), 'package.json'), path.join(remotePath, 'package.json'));
    await sftp.put(path.join(process.cwd(), 'package-lock.json'), path.join(remotePath, 'package-lock.json'));
    await sftp.put(path.join(process.cwd(), 'server.ts'), path.join(remotePath, 'server.ts'));

    console.log('✅ Deployment complete!');
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
  } finally {
    await sftp.end();
  }
}

deploy();
