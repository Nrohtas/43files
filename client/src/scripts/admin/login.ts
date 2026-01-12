document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;
    const usernameInput = document.getElementById('username') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Simple validation visualization
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        console.log('Attempting login for:', username);

        // Real API Authentication
        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store user info
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('userRole', data.user.role || 'user');

                    alert('Login Successful!');
                    window.location.href = '/admin/';
                } else {
                    alert(data.error || 'Login failed');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
    });
});
