/* =====================================================
   SmartFoodLink — Auth Page Logic
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    if (isLoggedIn()) {
        const user = getUser();
        redirectToDashboard(user.role);
        return;
    }

    // ─── Login Form ────────────────────────────────────
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('login-btn');
            btn.textContent = 'Logging in...';
            btn.disabled = true;

            try {
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                setToken(data.token);
                setUser(data.user);
                redirectToDashboard(data.user.role);
            } catch (err) {
                showAlert('alert-box', err.message, 'error');
                btn.textContent = 'Log In';
                btn.disabled = false;
            }
        });
    }

    // ─── Register Form ────────────────────────────────
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        // Check URL for role param
        const params = new URLSearchParams(window.location.search);
        if (params.get('role') === 'ngo') {
            selectRole('ngo');
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('register-btn');

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                showAlert('alert-box', 'Passwords do not match', 'error');
                return;
            }

            btn.textContent = 'Creating account...';
            btn.disabled = true;

            try {
                const payload = {
                    name: document.getElementById('name').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    password,
                    role: document.getElementById('role').value,
                    phone: document.getElementById('phone').value.trim(),
                    address: document.getElementById('address').value.trim()
                };

                const orgField = document.getElementById('organization');
                if (orgField && orgField.value.trim()) {
                    payload.organization = orgField.value.trim();
                }

                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                setToken(data.token);
                setUser(data.user);
                redirectToDashboard(data.user.role);
            } catch (err) {
                showAlert('alert-box', err.message, 'error');
                btn.textContent = 'Create Account';
                btn.disabled = false;
            }
        });
    }
});

// ─── Role Selector ──────────────────────────────────
function selectRole(role) {
    document.getElementById('role').value = role;

    document.querySelectorAll('.role-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.role === role);
    });

    // Show/hide org field for NGOs
    const orgGroup = document.getElementById('org-group');
    if (orgGroup) {
        orgGroup.style.display = role === 'ngo' ? 'block' : 'none';
    }
}

// ─── Redirect Helper ────────────────────────────────
function redirectToDashboard(role) {
    switch (role) {
        case 'admin': window.location.href = '/admin-dashboard.html'; break;
        case 'ngo': window.location.href = '/ngo-dashboard.html'; break;
        default: window.location.href = '/donor-dashboard.html';
    }
}
