/* =====================================================
   SmartFoodLink — Admin Dashboard Logic
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['admin'])) return;

    const user = getUser();
    document.getElementById('user-name').textContent = user.name;

    loadStats();
    loadUsers();
    loadListings();

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Sidebar nav
    document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
});

async function loadStats() {
    try {
        const stats = await apiFetch('/admin/stats');
        document.getElementById('stat-total-users').textContent = stats.totalUsers;
        document.getElementById('stat-total-donors').textContent = stats.totalDonors;
        document.getElementById('stat-total-ngos').textContent = stats.totalNGOs;
        document.getElementById('stat-total-listings').textContent = stats.totalListings;
        document.getElementById('stat-active').textContent = stats.activeListings;
        document.getElementById('stat-delivered').textContent = stats.deliveredListings;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

async function loadUsers() {
    try {
        const users = await apiFetch('/admin/users');
        const tbody = document.getElementById('users-table-body');

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h3>No users yet</h3></div></td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong>${u.organization ? `<br><small style="color:var(--clr-text-dim)">${u.organization}</small>` : ''}</td>
        <td>${u.email}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td>${u.phone || '—'}</td>
        <td>${formatDate(u.createdAt)}</td>
        <td>
          ${u.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u._id}')">Delete</button>` : '<span style="color:var(--clr-text-dim)">—</span>'}
        </td>
      </tr>
    `).join('');
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

async function loadListings() {
    try {
        const listings = await apiFetch('/admin/listings');
        const grid = document.getElementById('admin-listings-grid');

        if (listings.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h3>No listings yet</h3></div>`;
            return;
        }

        grid.innerHTML = listings.map(l => `
      <div class="food-card">
        <div class="food-card-body">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <h3>${l.title}</h3>
            <span class="badge badge-${l.status}">${l.status}</span>
          </div>
          <div class="food-meta">
            <span class="food-meta-item">📦 ${l.quantity}</span>
            <span class="food-meta-item">⏰ ${formatDateTime(l.expiresAt)}</span>
          </div>
          ${l.donor ? `<p style="font-size:.85rem;color:var(--clr-text-dim);margin-top:.25rem;">Donor: ${l.donor.name}</p>` : ''}
          ${l.claimedBy ? `<p style="font-size:.85rem;color:var(--clr-info);margin-top:.25rem;">Claimed by: ${l.claimedBy.name}</p>` : ''}
        </div>
      </div>
    `).join('');
    } catch (err) {
        console.error('Failed to load listings:', err);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
        await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
        loadUsers();
        loadStats();
    } catch (err) {
        alert(err.message);
    }
}

function showSection(name) {
    document.querySelectorAll('[id^="section-"]').forEach(el => el.style.display = 'none');
    const section = document.getElementById(`section-${name}`);
    if (section) section.style.display = 'block';
}
