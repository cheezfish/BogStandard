// Global variables
let map;
let markers = [];
let userLocation = null;
const defaultLocation = [51.5074, -0.1278]; // London

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupSorting();
    setupEnhancedSearch();
});

// Initialize the map
function initMap() {
    map = L.map('map').setView(defaultLocation, 13); // Default to London

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Set up locate button
    setupLocateButton();

    // Add markers for each toilet
    addMarkers();
}

// Set up locate button functionality
function setupLocateButton() {
    const locateButton = document.getElementById('locate-button');
    if (locateButton) {
        locateButton.addEventListener('click', function() {
            if (navigator.geolocation) {
                // Show loading state
                locateButton.disabled = true;
                locateButton.textContent = 'Locating...';
                
                navigator.geolocation.getCurrentPosition(
                    // Success callback
                    (position) => {
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
    }
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

// Debounce function to limit API calls while typing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Set up enhanced search functionality
function setupEnhancedSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.display = 'none';
    
    // Insert search results container after search input
    searchInput.parentNode.insertBefore(searchResults, searchInput.nextSibling);
    
    // Function to perform search
    const performSearch = debounce(function(query) {
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Show loading indicator
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        searchResults.style.display = 'block';
        
        // Call Nominatim API
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                searchResults.innerHTML = '';
                
                if (data.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
                    return;
                }
                
                // Display results (limit to 5)
                data.slice(0, 5).forEach(result => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.textContent = result.display_name;
                    
                    resultItem.addEventListener('click', function() {
                        // Set input value
                        searchInput.value = result.display_name;
                        
                        // Hide results
                        searchResults.style.display = 'none';
                        
                        // Set map view
                        const center = [parseFloat(result.lat), parseFloat(result.lon)];
                        map.setView(center, 13);
                        
                        // Add marker
                        if (window.searchMarker) {
                            map.removeLayer(window.searchMarker);
                        }
                        window.searchMarker = L.marker(center).addTo(map)
                            .bindPopup(`Search: ${result.display_name}`)
                            .openPopup();
                        
                        // Trigger distance sorting
                        sortCards('distance');
                    });
                    
                    searchResults.appendChild(resultItem);
                });
                
                searchResults.style.display = 'block';
            })
            .catch(error => {
                console.error("Error in geocoding request:", error);
                searchResults.innerHTML = '<div class="search-error">Error searching. Please try again.</div>';
            });
    }, 300); // 300ms debounce
    
    // Listen for input changes
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        performSearch(query);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Handle search button click
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Handle form submission (e.g., when user presses Enter)
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            if (query) {
                performSearch(query);
                searchResults.style.display = 'none';
            }
        }
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