/* =====================================================
   SmartFoodLink — Donor Dashboard Logic
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth(['donor'])) return;

    const user = getUser();
    document.getElementById('donor-name').textContent = user.name.split(' ')[0];
    document.getElementById('user-name').textContent = user.name;

    loadDonorData();

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

    // Post food form
    const postForm = document.getElementById('post-food-form');
    if (postForm) {
        postForm.addEventListener('submit', handlePostFood);
    }
});

async function loadDonorData() {
    try {
        const listings = await apiFetch('/food/my');
        const total = listings.length;
        const active = listings.filter(l => l.status === 'available').length;
        const claimed = listings.filter(l => l.status === 'claimed').length;
        const delivered = listings.filter(l => l.status === 'delivered').length;

        document.getElementById('total-posted').textContent = total;
        document.getElementById('total-active').textContent = active;
        document.getElementById('total-claimed').textContent = claimed;
        document.getElementById('total-delivered').textContent = delivered;

        // Recent listings table
        const tbody = document.getElementById('recent-listings-body');
        if (listings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">📦</div><h3>No Listings Yet</h3><p>Post your first food donation!</p></div></td></tr>`;
        } else {
            tbody.innerHTML = listings.slice(0, 10).map(l => `
        <tr>
          <td><strong>${l.title}</strong></td>
          <td>${l.quantity}</td>
          <td>${formatDateTime(l.expiresAt)}</td>
          <td><span class="badge badge-${l.status}">${l.status}</span></td>
          <td>${timeAgo(l.createdAt)}</td>
        </tr>
      `).join('');
        }

        // My listings grid
        renderMyListings(listings);
    } catch (err) {
        console.error('Failed to load donor data:', err);
    }
}

function renderMyListings(listings) {
    const grid = document.getElementById('my-listings-grid');
    if (listings.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">📦</div><h3>Nothing posted yet</h3><p>Click "Post New" to share surplus food.</p></div>`;
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
          <span class="food-meta-item">🏷️ ${l.category || 'cooked'}</span>
          <span class="food-meta-item">⏰ ${formatDateTime(l.expiresAt)}</span>
        </div>
        ${l.address ? `<p style="font-size:.85rem;color:var(--clr-text-muted);margin-top:.5rem;">📍 ${l.address}</p>` : ''}
        ${l.claimedBy ? `<p style="font-size:.85rem;color:var(--clr-info);margin-top:.5rem;">Claimed by: ${l.claimedBy.name || 'An NGO'}</p>` : ''}
      </div>
      <div class="food-card-actions">
        ${l.status === 'available' ? `<button class="btn btn-danger btn-sm" onclick="deleteListing('${l._id}')">Delete</button>` : ''}
        ${l.status === 'claimed' ? `<button class="btn btn-primary btn-sm" onclick="updateStatus('${l._id}', 'picked_up')">Mark Picked Up</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function handlePostFood(e) {
    e.preventDefault();
    const btn = document.getElementById('post-btn');
    btn.textContent = 'Posting...';
    btn.disabled = true;

    try {
        const payload = {
            title: document.getElementById('food-title').value.trim(),
            description: document.getElementById('food-desc').value.trim(),
            quantity: document.getElementById('food-qty').value.trim(),
            category: document.getElementById('food-category').value,
            expiresAt: document.getElementById('food-expiry').value,
            latitude: document.getElementById('food-lat').value,
            longitude: document.getElementById('food-lng').value,
            address: document.getElementById('food-address').value.trim(),
            contactPhone: document.getElementById('food-phone').value.trim()
        };

        await apiFetch('/food', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showAlert('post-alert', 'Food posted successfully! 🎉', 'success');
        document.getElementById('post-food-form').reset();
        loadDonorData();

        setTimeout(() => showSection('overview'), 1500);
    } catch (err) {
        showAlert('post-alert', err.message, 'error');
    } finally {
        btn.textContent = 'Post Food Donation';
        btn.disabled = false;
    }
}

async function deleteListing(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
        await apiFetch(`/food/${id}`, { method: 'DELETE' });
        loadDonorData();
    } catch (err) {
        alert(err.message);
    }
}

async function updateStatus(id, status) {
    try {
        await apiFetch(`/food/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        loadDonorData();
    } catch (err) {
        alert(err.message);
    }
}

function showSection(name) {
    document.querySelectorAll('[id^="section-"]').forEach(el => el.style.display = 'none');
    const section = document.getElementById(`section-${name}`);
    if (section) section.style.display = 'block';
}

function getMyLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            document.getElementById('food-lat').value = pos.coords.latitude.toFixed(6);
            document.getElementById('food-lng').value = pos.coords.longitude.toFixed(6);
        },
        () => alert('Could not get location. Please enter manually.')
    );
}
