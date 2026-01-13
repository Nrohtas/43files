import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Installing 43files Dashboard Dependencies...\n');

async function runCommand(command: string, args: string[], cwd: string): Promise<number> {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd,
            shell: true,
            stdio: 'inherit'
        });

        child.on('close', (code) => resolve(code || 0));
    });
}

async function install() {
    // Install root dependencies
    console.log('Step 1/3: Installing workspace dependencies...');
    const rootCode = await runCommand('npm', ['install'], __dirname);
    if (rootCode !== 0) {
        console.error('Failed to install root dependencies');
        process.exit(1);
    }

    // Install server dependencies
    console.log('\nStep 2/3: Installing server dependencies...');
    const serverCode = await runCommand('npm', ['install'], join(__dirname, 'server'));
    if (serverCode !== 0) {
        console.error('Failed to install server dependencies');
        process.exit(1);
    }

    // Install client dependencies
    console.log('\nStep 3/3: Installing client dependencies...');
    const clientCode = await runCommand('npm', ['install'], join(__dirname, 'client'));
    if (clientCode !== 0) {
        console.error('Failed to install client dependencies');
        process.exit(1);
    }

    console.log('\n========================================');
    console.log('Installation Complete!');
    console.log('========================================');
    console.log('\nYou can now run:');
    console.log('  npx tsx start.ts    - Start both server and client');
    console.log('  cd server && npm run dev  - Server only');
    console.log('  cd client && npm run dev  - Client only');
}

install();
