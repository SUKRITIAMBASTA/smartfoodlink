/* =====================================================
   SmartFoodLink — Live Map (Leaflet.js + OpenStreetMap)
   ===================================================== */

let map;
let markersLayer;
let userMarker;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadMapListings();
});

function initMap() {
    // Default center: New Delhi, India
    map = L.map('map-container', {
        center: [28.6139, 77.2090],
        zoom: 12,
        zoomControl: true
    });

    // Dark-themed tile layer (CartoDB dark matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    document.getElementById('map-status').textContent = 'Map ready';
}

async function loadMapListings() {
    try {
        document.getElementById('map-status').textContent = 'Loading listings...';
        const listings = await apiFetch('/food');

        markersLayer.clearLayers();

        if (listings.length === 0) {
            document.getElementById('map-status').textContent = 'No available food listings';
            return;
        }

        listings.forEach(listing => {
            if (!listing.location || !listing.location.coordinates) return;

            const [lng, lat] = listing.location.coordinates;
            if (lat === 0 && lng === 0) return; // Skip default coords

            const marker = L.marker([lat, lng], {
                icon: createFoodIcon(listing.category)
            }).addTo(markersLayer);

            const expiryDate = new Date(listing.expiresAt);
            const hoursLeft = Math.max(0, Math.round((expiryDate - Date.now()) / 3600000));

            marker.bindPopup(`
        <div style="min-width:200px;">
          <h3>${listing.title}</h3>
          <p>📦 <strong>${listing.quantity}</strong></p>
          <p>🏷️ ${listing.category || 'Cooked food'}</p>
          <p>⏰ ${hoursLeft}h left to pick up</p>
          ${listing.address ? `<p>📍 ${listing.address}</p>` : ''}
          ${listing.donor ? `<p style="margin-top:6px;font-size:.8rem;">By: ${listing.donor.name}</p>` : ''}
          ${listing.contactPhone ? `<p style="margin-top:4px;"><a href="tel:${listing.contactPhone}" style="color:var(--clr-primary-light);">📞 ${listing.contactPhone}</a></p>` : ''}
        </div>
      `);
        });

        // Fit map to markers
        const bounds = markersLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        document.getElementById('map-status').textContent = `${listings.length} listing(s) shown`;
    } catch (err) {
        document.getElementById('map-status').textContent = 'Could not load listings';
        console.error('Map listings error:', err);
    }
}

function findNearMe() {
    const btn = document.getElementById('locate-btn');
    btn.textContent = '⏳ Locating...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        btn.textContent = '📍 Near Me';
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 14);

            // Add user marker
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker([latitude, longitude], {
                radius: 10,
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
                color: '#fff',
                weight: 2
            }).addTo(map).bindPopup('📍 You are here').openPopup();

            btn.textContent = '📍 Near Me';
            btn.disabled = false;
            document.getElementById('map-status').textContent = 'Centered on your location';
        },
        (err) => {
            alert('Could not get your location. Please check permissions.');
            btn.textContent = '📍 Near Me';
            btn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Custom food icon using emoji circle markers
function createFoodIcon(category) {
    const emojiMap = {
        cooked: '🍲',
        raw: '🥬',
        packaged: '📦',
        beverages: '🥤',
        other: '🍽️'
    };

    const emoji = emojiMap[category] || '🍽️';

    return L.divIcon({
        html: `<div style="
      width:36px;height:36px;
      background:linear-gradient(135deg,#10b981,#059669);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
      box-shadow:0 2px 8px rgba(16,185,129,.4);
      border:2px solid rgba(255,255,255,.3);
    ">${emoji}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
    });
}
