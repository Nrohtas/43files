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
        const API_BASE = import.meta.env.VITE_API_BASE_URL;
        fetch(`${API_BASE}/api/login`, {
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
                    localStorage.setItem('username', data.user.username || '');

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
