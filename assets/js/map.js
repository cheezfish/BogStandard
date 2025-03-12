// Global variables
let map;
let markers = [];
let userLocation = null;
const defaultLocation = [51.5074, -0.1278]; // London

// Initialize the map when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded, initializing map...");
    
    // Test API call to check if Nominatim works
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=london')
        .then(response => {
            console.log("API test status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("API test data received:", data.length > 0);
        })
        .catch(error => {
            console.error("API test error:", error);
        });
    
    initMap();
    setupSorting();
    setupEnhancedSearch();
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

// Alternative enhanced search implementation with debugging
function setupEnhancedSearch() {
    console.log("Setting up enhanced search...");
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (!searchInput) {
        console.error("Search input element not found!");
        return;
    }
    if (!searchButton) {
        console.error("Search button element not found!");
    }
    
    console.log("Search elements found");
    
    // Create and append results container
    const searchContainer = searchInput.parentElement;
    if (!searchContainer) {
        console.error("Could not find parent container for search input");
        return;
    }
    
    searchContainer.style.position = 'relative';
    
    // Create results container
    const searchResults = document.createElement('div');
    searchResults.id = 'search-results';
    searchResults.style.display = 'none';
    searchResults.style.position = 'absolute';
    searchResults.style.top = (searchInput.offsetHeight + 5) + 'px';
    searchResults.style.left = '0';
    searchResults.style.width = searchInput.offsetWidth + 'px';
    searchResults.style.maxHeight = '300px';
    searchResults.style.overflowY = 'auto';
    searchResults.style.background = 'white';
    searchResults.style.border = '1px solid #ccc';
    searchResults.style.borderRadius = '0 0 4px 4px';
    searchResults.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    searchResults.style.zIndex = '1000';
    
    searchContainer.appendChild(searchResults);
    console.log("Search results container added to DOM");
    
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
        console.log("Performing search for:", query);
        
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }
        
        // Show loading
        searchResults.innerHTML = '<div style="padding:10px;color:#666;font-style:italic;">Searching...</div>';
        searchResults.style.display = 'block';
        
        console.log("Fetching from Nominatim:", query);
        // API call
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => {
                console.log("API response status:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("Search results:", data.length, "items");
                searchResults.innerHTML = '';
                
                if (data.length === 0) {
                    searchResults.innerHTML = '<div style="padding:10px;color:#666;font-style:italic;">No results found</div>';
                    return;
                }
                
                // Create results
                data.slice(0, 5).forEach(result => {
                    const item = document.createElement('div');
                    item.style.padding = '10px';
                    item.style.borderBottom = '1px solid #eee';
                    item.style.cursor = 'pointer';
                    item.textContent = result.display_name;
                    
                    item.addEventListener('mouseover', function() {
                        this.style.backgroundColor = '#f5f5f5';
                    });
                    
                    item.addEventListener('mouseout', function() {
                        this.style.backgroundColor = '';
                    });
                    
                    item.addEventListener('click', function() {
                        console.log("Search result clicked:", result.display_name);
                        searchInput.value = result.display_name;
                        searchResults.style.display = 'none';
                        
                        const center = [parseFloat(result.lat), parseFloat(result.lon)];
                        console.log("Setting map view to:", center);
                        map.setView(center, 13);
                        
                        if (window.searchMarker) {
                            map.removeLayer(window.searchMarker);
                        }
                        window.searchMarker = L.marker(center).addTo(map)
                            .bindPopup(`Search: ${result.display_name}`)
                            .openPopup();
                        
                        sortCards('distance');
                    });
                    
                    searchResults.appendChild(item);
                });
                
                console.log("Results displayed");
            })
            .catch(error => {
                console.error("Search error:", error);
                searchResults.innerHTML = '<div style="padding:10px;color:#e74c3c;">Error searching. Try again.</div>';
            });
    }, 300);
    
    // Input handler
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        console.log("Search input changed:", query);
        performSearch(query);
    });
    
    // Close results when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Handle search button click
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            console.log("Search button clicked with query:", query);
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Handle Enter key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim();
            console.log("Enter key pressed with query:", query);
            if (query) {
                performSearch(query);
            }
        }
    });
    
    console.log("Enhanced search setup complete");
}

// Set up sorting functionality
function setupSorting() {
    console.log("Setting up sorting...");
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        // Set initial sort
        sortCards('distance');

        // Add change event listener
        sortSelect.addEventListener('change', function() {
            console.log("Sort changed to:", this.value);
            sortCards(this.value);
        });
        console.log("Sorting setup complete");
    } else {
        console.warn("Sort select element not found");
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