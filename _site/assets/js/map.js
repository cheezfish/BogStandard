// Global variables
let map;
let markers = [];
let userLocation = null;
const defaultLocation = [51.5074, -0.1278]; // London

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded, initializing map...");
    initMap();
    setupSorting();
    setupEnhancedSearch();
    setupRadiusFilter();
});

// Initialize the map
function initMap() {
    console.log("Initializing map...");
    map = L.map('map').setView(defaultLocation, 13); // Default to London

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Set up locate button
    setupLocateButton();

    // Add markers for each toilet
    addMarkers();
    console.log("Map initialized");
}

// Set up locate button functionality
function setupLocateButton() {
    console.log("Setting up locate button...");
    const locateButton = document.getElementById('locate-button');
    if (locateButton) {
        locateButton.addEventListener('click', function() {
            console.log("Locate button clicked");
            if (navigator.geolocation) {
                // Show loading state
                locateButton.disabled = true;
                locateButton.textContent = 'Locating...';
                
                navigator.geolocation.getCurrentPosition(
                    // Success callback
                    (position) => {
                        console.log("Got user position:", position.coords.latitude, position.coords.longitude);
                        userLocation = [position.coords.latitude, position.coords.longitude];
                        map.setView(userLocation, 15);

                        // Add or update user marker
                        if (window.userMarker) {
                            window.userMarker.setLatLng(userLocation);
                        } else {
                            window.userMarker = L.marker(userLocation).addTo(map)
                                .bindPopup("Your location");
                        }
                        window.userMarker.openPopup();
                        
                        // Re-sort by distance if that's the current sort
                        if (document.getElementById('sort-select').value === 'distance') {
                            sortCards('distance');
                        }
                        
                        // Reset button
                        locateButton.disabled = false;
                        locateButton.innerHTML = '<i class="fa fa-location-arrow"></i> My Location';
                    },
                    // Error callback
                    (error) => {
                        console.error("Error getting location:", error);
                        alert("Could not get your location. Please check your browser permissions.");
                        
                        // Reset button
                        locateButton.disabled = false;
                        locateButton.innerHTML = '<i class="fa fa-location-arrow"></i> My Location';
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        });
        console.log("Locate button setup complete");
    } else {
        console.warn("Locate button not found in DOM");
    }
}

// Add markers for all toilets
function addMarkers() {
    console.log("Adding markers...");
    const cards = document.querySelectorAll('.card');
    console.log(`Found ${cards.length} cards to add markers for`);

    cards.forEach((card) => {
        const locationStr = card.getAttribute('data-location');
        if (!locationStr) {
            console.warn("Card missing data-location attribute:", card);
            return;
        }

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
    console.log(`Added ${markers.length} markers`);
}

// Enhanced search with autocomplete and suggestions
function setupEnhancedSearch() {
    console.log("Setting up enhanced search...");
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    searchResults.style.display = 'none';
    searchResults.style.position = 'absolute';

    // Calculate position based on input's bounding box
    const inputRect = searchInput.getBoundingClientRect();
    searchResults.style.top = (inputRect.bottom + window.scrollY - 110) + 'px';
    searchResults.style.left = inputRect.left + 'px';
    searchResults.style.width = inputRect.width + 'px';
    searchResults.style.maxHeight = '300px';
    searchResults.style.overflowY = 'auto';

    // Apply styles from your CSS (search-suggestions class)
    searchResults.classList.add('search-suggestions'); // Add the class

    searchResults.style.zIndex = '1000';
    searchInput.parentElement.appendChild(searchResults);

    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Perform search with debounce
    const performSearch = debounce(function(query) {
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }

        searchResults.innerHTML = '<div style="padding:10px;color:#666;font-style:italic;">Searching...</div>';
        searchResults.style.display = 'block';

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                searchResults.innerHTML = '';
                if (data.length === 0) {
                    searchResults.innerHTML = '<div style="padding:10px;color:#666;font-style:italic;">No results found</div>';
                    return;
                }

                data.slice(0, 5).forEach(result => {
                    const item = document.createElement('div');
                    item.style.padding = '10px';
                    item.style.borderBottom = '1px solid #eee';
                    item.style.cursor = 'pointer';
                    item.textContent = result.display_name;

                    item.addEventListener('click', function() {
                        searchInput.value = result.display_name;
                        searchResults.style.display = 'none';

                        const center = [parseFloat(result.lat), parseFloat(result.lon)];
                        map.setView(center, 13);

                        if (window.searchMarker) {
                            map.removeLayer(window.searchMarker);
                        }
                        window.searchMarker = L.marker(center).addTo(map)
                            .bindPopup(`Search: ${result.display_name}`)
                            .openPopup();

                        sortCards('distance');
                        filterByRadius(center);
                    });

                    searchResults.appendChild(item);
                });
            })
            .catch(error => {
                console.error("Search error:", error);
                searchResults.innerHTML = '<div style="padding:10px;color:#e74c3c;">Error searching. Try again.</div>';
            });
    }, 300);

    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        performSearch(query);
    });

    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    searchButton.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
}

// Set up radius filtering
function setupRadiusFilter() {
    const radiusInput = document.getElementById('radius-input');
    if (radiusInput) {
        radiusInput.addEventListener('input', function() {
            const radius = parseFloat(this.value);
            if (!isNaN(radius) && radius > 0) {
                const center = map.getCenter();
                filterByRadius([center.lat, center.lng], radius);
            }
        });
    }
}

// Filter markers by radius
function filterByRadius(center, radius) {
    const radiusInput = document.getElementById('radius-input');
    if (!radiusInput) return;

    radius = radius || parseFloat(radiusInput.value);
    if (isNaN(radius) || radius <= 0) return;

    markers.forEach(markerData => {
        const distance = calculateDistance(center[0], center[1], markerData.location[0], markerData.location[1]);
        if (distance <= radius * 1000) {
            markerData.marker.addTo(map);
            markerData.card.style.display = 'block';
        } else {
            markerData.marker.remove();
            markerData.card.style.display = 'none';
        }
    });
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

// Set up sorting functionality
function setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortCards('distance');
        sortSelect.addEventListener('change', function() {
            sortCards(this.value);
        });
    }
}

// Sort cards function
function sortCards(sortBy) {
    const cardsContainer = document.getElementById('cards-container');
    if (!cardsContainer) return;

    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    if (cards.length === 0) return;

    switch (sortBy) {
        case 'distance':
            let referenceLocation = userLocation;
            const searchLocation = map.getCenter();

            if (searchLocation && searchLocation !== defaultLocation) {
                referenceLocation = [searchLocation.lat, searchLocation.lng];
            }

            if (!referenceLocation) {
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
                return ratingB - ratingA;
            });
            break;
        case 'date':
            cards.sort((a, b) => {
                const dateA = new Date(a.getAttribute('data-date'));
                const dateB = new Date(b.getAttribute('data-date'));
                return dateB - dateA;
            });
            break;
        default:
            console.log("No sort selected, or unknown sort");
    }

    cardsContainer.innerHTML = '';
    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });
}

searchResults.style.border = '2px solid red'; // Add this line