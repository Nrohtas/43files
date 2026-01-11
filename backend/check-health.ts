
import http from 'http';

function checkHealth() {
    console.log('Checking server health on port 3000...');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/districts',
        method: 'GET',
        timeout: 2000
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk.substring(0, 100)}...`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`PROBLEM with request: ${e.message}`);
    });

    req.end();
}

checkHealth();
