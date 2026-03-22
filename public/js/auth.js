document.addEventListener("DOMContentLoaded", () => {
    
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if(token && user) {
        window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
        return;
    }

    const modeTabs = document.querySelectorAll('.mode-tab');
    const roleOptions = document.querySelectorAll('.role-option');
    const signupFields = document.getElementById('signupFields');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    
    let currentMode = 'login'; 
    let selectedRole = 'user'; // For signup

    // Mode switching logic (Login vs Register)
    modeTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            modeTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = e.target.getAttribute('data-mode');
            
            document.getElementById('errorBox').style.display = 'none';

            if(currentMode === 'register') {
                signupFields.style.display = 'block';
                formTitle.textContent = 'Create an Account';
                formSubtitle.textContent = 'Join Evalio to start your journey';
                submitBtn.innerHTML = 'Sign Up <i class="fa-solid fa-user-plus ml-2" style="margin-left:8px;"></i>';
                document.getElementById('name').setAttribute('required', 'true');
            } else {
                signupFields.style.display = 'none';
                formTitle.textContent = 'Welcome Back';
                formSubtitle.textContent = 'Please enter your credentials to continue';
                submitBtn.innerHTML = 'Sign In <i class="fa-solid fa-arrow-right ml-2" style="margin-left:8px;"></i>';
                document.getElementById('name').removeAttribute('required');
            }
        });
    });

    // Role switching for Signup
    roleOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            roleOptions.forEach(o => o.classList.remove('selected'));
            const target = e.currentTarget;
            target.classList.add('selected');
            selectedRole = target.getAttribute('data-role');
        });
    });

    // Form submission Handlers
    const authForm = document.getElementById('authForm');
    
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorBox = document.getElementById('errorBox');
        
        const payload = { email, password };
        let endpoint = '/api/auth/login';

        if(currentMode === 'register') {
            payload.name = document.getElementById('name').value.trim();
            payload.role = selectedRole;
            endpoint = '/api/auth/register';
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Redirect based on role
            if(data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } catch (err) {
            errorBox.textContent = err.message;
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = currentMode === 'login' 
                ? 'Sign In <i class="fa-solid fa-arrow-right ml-2" style="margin-left:8px;"></i>'
                : 'Sign Up <i class="fa-solid fa-user-plus ml-2" style="margin-left:8px;"></i>';
        }
    });
});
