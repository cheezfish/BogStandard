// Global variables
let map;
let markers = [];
let userLocation = null;
const defaultLocation = [51.5074, -0.1278]; // London

// Initialize the map
function initMap() {
    map = L.map('map');
    
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
                L.marker(userLocation, {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '📍',
                        iconSize: [25, 25],
                        iconAnchor: [12, 25]
                    })
                }).addTo(map).bindPopup("You are here");
                
                // Initialize with distance sorting
                sortCards('distance');
            },
            // Error callback
            (error) => {
                console.log("Geolocation error:", error);
                map.setView(defaultLocation, 13);
                sortCards('distance');
            }
        );
    } else {
        // Geolocation not supported
        map.setView(defaultLocation, 13);
        sortCards('distance');
    }
    
    // Add markers for each toilet
    addMarkers();
    
    // Set up event listeners
    setupEventListeners();
}

// Add markers for all toilets
function addMarkers() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card) => {
        const location = card.getAttribute('data-location').split(',').map(Number);
        const title = card.getAttribute('data-title');
        
        const marker = L.marker(location).addTo(map)
            .bindPopup(title)
            .on('click', () => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('highlight');
                setTimeout(() => card.classList.remove('highlight'), 2000);
            });
        
        markers.push({
            marker: marker,
            location: location,
            card: card
        });
        
        card.addEventListener('click', () => {
            map.setView(location, 15);
            marker.openPopup();
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search by radius
    const searchButton = document.getElementById('search-button');
    searchButton.addEventListener('click', searchByRadius);
    
    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', (e) => {
        sortCards(e.target.value);
    });
}

// Search by radius function
function searchByRadius() {
    const query = document.getElementById('search-input').value;
    const radius = parseFloat(document.getElementById('radius-input').value) * 1000; // Convert km to meters
    
    if (!query || isNaN(radius)) return;
    
    // Use a geocoding service to get coordinates for the query
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const center = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                map.setView(center, 13);
                
                // Highlight toilets within the radius
                markers.forEach(({marker, location}) => {
                    const distance = map.distance(center, location);
                    if (distance <= radius) {
                        marker.openPopup();
                    }
                });
                
                // Re-sort by distance from search location
                document.getElementById('sort-select').value = 'distance';
                sortCards('distance', center);
            }
        });
}

// Sort cards function
function sortCards(sortBy, center = null) {
    const cardsContainer = document.getElementById('cards-container');
    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    
    switch(sortBy) {
        case 'rating':
            cards.sort((a, b) => {
                return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating'));
            });
            break;
            
        case 'date':
            cards.sort((a, b) => {
                const dateA = new Date(a.getAttribute('data-date'));
                const dateB = new Date(b.getAttribute('data-date'));
                return dateB - dateA; // Most recent first
            });
            break;
            
        case 'distance':
            // If no center is provided, use user location or map center
            if (!center) {
                center = userLocation || map.getCenter();
            }
            
            cards.sort((a, b) => {
                const locA = a.getAttribute('data-location').split(',').map(Number);
                const locB = b.getAttribute('data-location').split(',').map(Number);
                const distA = map.distance(center, locA);
                const distB = map.distance(center, locB);
                return distA - distB;
            });
            break;
    }
    
    // Clear and re-append cards in the new order
    cards.forEach(card => cardsContainer.appendChild(card));
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initMap);

// Add this function to your map.js file

// Convert numerical ratings to star display
function initializeStarRatings() {
    const ratingElements = document.querySelectorAll('.card p strong:contains("Rating:")');
    
    ratingElements.forEach(element => {
        const parentElement = element.parentElement;
        const ratingText = parentElement.textContent;
        const ratingMatch = ratingText.match(/Rating:\s*(\d+(\.\d+)?)/);
        
        if (ratingMatch) {
            const rating = parseFloat(ratingMatch[1]);
            const maxRating = 5;
            
            // Create star rating HTML
            const starsHtml = createStarRating(rating, maxRating);
            
            // Replace text with star display
            parentElement.innerHTML = `<strong>Rating:</strong> <span class="star-rating">${starsHtml}</span> (${rating}/5)`;
        }
    });
}

// Create star rating HTML
function createStarRating(rating, maxRating) {
    let html = '';
    
    // Full stars
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
        html += '★';
    }
    
    // Half star
    if (rating % 1 >= 0.5) {
        html += '☆';
    }
    
    // Empty stars
    const emptyStars = Math.floor(maxRating - rating - (rating % 1 >= 0.5 ? 0.5 : 0));
    for (let i = 0; i < emptyStars; i++) {
        html += '☆';
    }
    
    return html;
}

// Add this line to your initMap function or document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Existing code...
    
    // Initialize star ratings
    initializeStarRatings();
});