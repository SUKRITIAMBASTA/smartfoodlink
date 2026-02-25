/* =====================================================
   SmartFoodLink — NGO Dashboard Logic
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['ngo'])) return;

    const user = getUser();
    document.getElementById('user-name').textContent = user.name;

    loadAvailableFood();
    loadMyClaimedFood();

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

async function loadAvailableFood() {
    try {
        const listings = await apiFetch('/food');
        document.getElementById('available-count').textContent = listings.length;

        const grid = document.getElementById('available-food-grid');
        if (listings.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="icon">🍽️</div><h3>No Food Available</h3><p>Check back soon for new listings!</p></div>`;
            return;
        }

        grid.innerHTML = listings.map(l => `
      <div class="food-card">
        <div class="food-card-body">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <h3>${l.title}</h3>
            <span class="badge badge-available">Available</span>
          </div>
          ${l.description ? `<p style="font-size:.9rem;color:var(--clr-text-muted);margin:.5rem 0;">${l.description}</p>` : ''}
          <div class="food-meta">
            <span class="food-meta-item">📦 ${l.quantity}</span>
            <span class="food-meta-item">🏷️ ${l.category || 'cooked'}</span>
            <span class="food-meta-item">⏰ ${formatDateTime(l.expiresAt)}</span>
          </div>
          ${l.address ? `<p style="font-size:.85rem;color:var(--clr-text-muted);margin-top:.5rem;">📍 ${l.address}</p>` : ''}
          ${l.donor ? `<p style="font-size:.85rem;color:var(--clr-text-dim);margin-top:.25rem;">By: ${l.donor.name}${l.donor.organization ? ' — ' + l.donor.organization : ''}</p>` : ''}
        </div>
        <div class="food-card-actions">
          <button class="btn btn-primary btn-sm" onclick="claimFood('${l._id}')">🤝 Claim This Food</button>
          ${l.contactPhone ? `<a class="btn btn-outline btn-sm" href="tel:${l.contactPhone}">📞 Call</a>` : ''}
        </div>
      </div>
    `).join('');
    } catch (err) {
        console.error('Failed to load food:', err);
    }
}

async function loadMyClaimedFood() {
    try {
        const listings = await apiFetch('/food/my');
        const claimed = listings.filter(l => l.status === 'claimed');
        const pickedUp = listings.filter(l => l.status === 'picked_up');
        const delivered = listings.filter(l => l.status === 'delivered');

        document.getElementById('my-claimed-count').textContent = claimed.length;
        document.getElementById('picked-up-count').textContent = pickedUp.length;
        document.getElementById('delivered-count').textContent = delivered.length;

        const grid = document.getElementById('claimed-food-grid');
        if (listings.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>No Claims Yet</h3><p>Browse available food and claim what you need.</p></div>`;
            return;
        }

        grid.innerHTML = listings.map(l => `
      <div class="food-card">
        <div class="food-card-body">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <h3>${l.title}</h3>
            <span class="badge badge-${l.status}">${l.status.replace('_', ' ')}</span>
          </div>
          <div class="food-meta">
            <span class="food-meta-item">📦 ${l.quantity}</span>
            <span class="food-meta-item">⏰ ${formatDateTime(l.expiresAt)}</span>
          </div>
          ${l.address ? `<p style="font-size:.85rem;color:var(--clr-text-muted);margin-top:.5rem;">📍 ${l.address}</p>` : ''}
          ${l.donor ? `<p style="font-size:.85rem;color:var(--clr-text-dim);margin-top:.25rem;">Donor: ${l.donor.name}</p>` : ''}
        </div>
        <div class="food-card-actions">
          ${l.status === 'claimed' ? `<button class="btn btn-warning btn-sm" onclick="updateClaimStatus('${l._id}', 'picked_up')">📦 Mark Picked Up</button>` : ''}
          ${l.status === 'picked_up' ? `<button class="btn btn-primary btn-sm" onclick="updateClaimStatus('${l._id}', 'delivered')">✅ Mark Delivered</button>` : ''}
        </div>
      </div>
    `).join('');
    } catch (err) {
        console.error('Failed to load claimed food:', err);
    }
}

async function claimFood(id) {
    if (!confirm('Claim this food donation? You commit to picking it up.')) return;
    try {
        await apiFetch(`/food/${id}/claim`, { method: 'PATCH' });
        alert('Food claimed successfully! 🎉');
        loadAvailableFood();
        loadMyClaimedFood();
    } catch (err) {
        alert(err.message);
    }
}

async function updateClaimStatus(id, status) {
    try {
        await apiFetch(`/food/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        loadMyClaimedFood();
    } catch (err) {
        alert(err.message);
    }
}

function showSection(name) {
    document.querySelectorAll('[id^="section-"]').forEach(el => el.style.display = 'none');
    const section = document.getElementById(`section-${name}`);
    if (section) section.style.display = 'block';
}
