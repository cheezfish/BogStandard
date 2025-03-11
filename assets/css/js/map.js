// Initialize the map
const map = L.map('map').setView([40.7128, -74.0060], 13); // Default to NYC
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add markers for each toilet
const cards = document.querySelectorAll('.card');
const markers = [];

cards.forEach((card, index) => {
    const location = card.getAttribute('data-location').split(',').map(Number);
    const title = card.getAttribute('data-title');

    const marker = L.marker(location).addTo(map)
        .bindPopup(title)
        .on('click', () => {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 2000);
        });

    markers.push(marker);

    card.addEventListener('click', () => {
        map.setView(location, 15);
        marker.openPopup();
    });
});

// Search by radius
const searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    const radius = parseFloat(document.getElementById('radius-input').value) * 1000; // Convert km to meters

    if (!query || !radius) return;

    // Use a geocoding service (e.g., Nominatim) to get coordinates for the query
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const center = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                map.setView(center, 13);

                // Highlight toilets within the radius
                markers.forEach(marker => {
                    const distance = map.distance(center, marker.getLatLng());
                    if (distance <= radius) {
                        marker.openPopup();
                    }
                });
            }
        });
});