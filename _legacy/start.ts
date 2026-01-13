import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting 43files Dashboard...\n');
console.log('Server: http://localhost:3000');
console.log('Client: http://localhost:5173');
console.log('\nPress Ctrl+C to stop both server and client\n');

let server: ChildProcess;
let client: ChildProcess;

// Start server
server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: join(__dirname, 'server'),
    shell: true,
    stdio: 'inherit'
});

// Wait a bit then start client
setTimeout(() => {
    client = spawn('npx', ['vite'], {
        cwd: join(__dirname, 'client'),
        shell: true,
        stdio: 'inherit'
    });

    // Handle termination
    process.on('SIGINT', () => {
        console.log('\nStopping server and client...');
        server.kill();
        client.kill();
        process.exit();
    });

    client.on('close', (code) => {
        console.log('Client stopped');
        server.kill();
        process.exit(code || 0);
    });
}, 2000);

server.on('close', (code) => {
    console.log('Server stopped');
    if (client) client.kill();
    process.exit(code || 0);
});
