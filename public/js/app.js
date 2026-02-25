/* =====================================================
   SmartFoodLink — Shared Utilities (app.js)
   ===================================================== */

const API_BASE = '/api';

// ─── Auth Helpers ────────────────────────────────────
function getToken() {
    return localStorage.getItem('sfl_token');
}

function setToken(token) {
    localStorage.setItem('sfl_token', token);
}

function getUser() {
    const raw = localStorage.getItem('sfl_user');
    return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
    localStorage.setItem('sfl_user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('sfl_token');
    localStorage.removeItem('sfl_user');
    window.location.href = '/login.html';
}

function isLoggedIn() {
    return !!getToken();
}

// ─── API Fetch Wrapper ──────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}

// ─── Navbar scroll effect ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // Mobile nav toggle
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open');
        });
    }

    // Update nav based on auth state
    updateNavAuth();
});

function updateNavAuth() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    const user = getUser();

    if (user) {
        // Replace login/register buttons with dashboard link
        const authBtns = navLinks.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authBtns.forEach(btn => btn.remove());

        const dashLink = document.createElement('a');
        dashLink.href = user.role === 'admin' ? 'admin-dashboard.html'
            : user.role === 'ngo' ? 'ngo-dashboard.html'
                : 'donor-dashboard.html';
        dashLink.className = 'btn btn-primary btn-sm';
        dashLink.textContent = 'Dashboard';
        navLinks.appendChild(dashLink);
    }
}

// ─── Date Formatting ────────────────────────────────
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Toast Notification ─────────────────────────────
function showAlert(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.textContent = message;
    setTimeout(() => el.classList.remove('show'), 5000);
}

// ─── Guard Pages ────────────────────────────────────
function requireAuth(allowedRoles = []) {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    const user = getUser();
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}
