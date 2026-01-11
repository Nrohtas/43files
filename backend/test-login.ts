async function testLogin() {
    console.log('Testing Admin Login API...');

    try {
        // Test 1: Successful Login
        const successResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin' })
        });

        const successData = await successResponse.json();
        console.log('Test 1 (Valid Credentials):', successResponse.status === 200 ? 'PASSED' : 'FAILED', successData);

        // Test 2: Invalid Password
        const failResponse = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
        });

        const failData = await failResponse.json();
        console.log('Test 2 (Invalid Password):', failResponse.status === 401 ? 'PASSED' : 'FAILED', failData);

    } catch (error) {
        console.error('Error testing login:', error);
    }
}

testLogin();
