// Global variables
let map;
let markers = [];
let userLocation = null;
const defaultLocation = [51.5074, -0.1278]; // London

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupSorting();
});

// Initialize the map
function initMap() {
    map = L.map('map').setView(defaultLocation, 13); // Default to London

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
                map.setView(userLocation, 13);

                // User marker
                L.marker(userLocation).addTo(map)
                    .bindPopup("Your location")
                    .openPopup();
            },
            // Error callback - silently continue with default location
            () => {}
        );
    }

    // Add markers for each toilet
    addMarkers();
}

// Add markers for all toilets
function addMarkers() {
    const cards = document.querySelectorAll('.card');

    cards.forEach((card) => {
        const locationStr = card.getAttribute('data-location');
        if (!locationStr) return;

        const location = locationStr.split(',').map(Number);
        const title = card.getAttribute('data-title') || 'Unnamed Location';

        const marker = L.marker(location).addTo(map)
            .bindPopup(title)
            .on('click', () => {
                card.scrollIntoView({ behavior: 'smooth' });
                card.classList.add('highlight');
                setTimeout(() => card.classList.remove('highlight'), 2000);
            });

        markers.push({
            marker: marker,
            location: location,
            card: card
        });

        // Add click event to cards
        card.addEventListener('click', () => {
            map.setView(location, 15);
            marker.openPopup();
        });
    });
}

// Set up sorting functionality
function setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        // Set initial sort
        sortCards('distance');

        // Add change event listener
        sortSelect.addEventListener('change', function() {
            sortCards(this.value);
        });
    }
}

// Function to calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Sort cards function
function sortCards(sortBy) {
    console.log("Sorting by:", sortBy);

    const cardsContainer = document.getElementById('cards-container');
    if (!cardsContainer) {
        console.error("Cards container not found");
        return;
    }

    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    if (cards.length === 0) {
        console.warn("No cards found to sort");
        return;
    }

    console.log(`Found ${cards.length} cards to sort`);

    switch (sortBy) {
        case 'distance':
            let referenceLocation = userLocation;
            const searchLocation = map.getCenter();

            if (searchLocation && searchLocation !== defaultLocation) {
                referenceLocation = [searchLocation.lat, searchLocation.lng];
            }

            if (!referenceLocation) {
                console.warn("User location or search location not available. Using default.");
                referenceLocation = defaultLocation;
            }

            cards.sort((a, b) => {
                const locA = a.getAttribute('data-location').split(',').map(Number);
                const locB = b.getAttribute('data-location').split(',').map(Number);

                const distA = calculateDistance(referenceLocation[0], referenceLocation[1], locA[0], locA[1]);
                const distB = calculateDistance(referenceLocation[0], referenceLocation[1], locB[0], locB[1]);

                return distA - distB;
            });
            break;
        case 'rating':
            cards.sort((a, b) => {
                const ratingA = parseFloat(a.getAttribute('data-rating'));
                const ratingB = parseFloat(b.getAttribute('data-rating'));
                return ratingB - ratingA; // Descending order (highest rating first)
            });
            break;
        case 'date':
            cards.sort((a, b) => {
                const dateA = new Date(a.getAttribute('data-date'));
                const dateB = new Date(b.getAttribute('data-date'));
                return dateB - dateA; // Descending order (most recent first)
            });
            break;
        default:
            console.log("No sort selected, or unknown sort");
    }

    // Clear the container first
    cardsContainer.innerHTML = '';

    // Then append all cards in the new order
    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });

    console.log("Sorting complete");
}

// Search implementation
const searchButton = document.getElementById('search-button');
if (searchButton) {
    searchButton.addEventListener('click', function() {
        const query = document.getElementById('search-input').value;

        if (!query) return;

        // Use Nominatim for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const center = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                    map.setView(center, 13);

                    // Optional: Add a marker at the search location
                    L.marker(center).addTo(map)
                        .bindPopup(`Search: ${query}`)
                        .openPopup();

                    // Trigger distance sorting after search
                    sortCards('distance');
                }
            })
            .catch(error => {
                console.error("Error in geocoding request:", error);
            });
    });
}