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
    updateRatingsToEmojis();
    customizePopups();
});

// Initialize the map
function initMap() {
    console.log("Initializing map...");
    
    // Create map with minimal controls
    map = L.map('map', {
        zoomControl: false,  // Remove the default zoom controls
        attributionControl: false  // Remove the attribution text
    }).setView(defaultLocation, 13);
    
    // Add minimal zoom controls
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    
    // Add minimal attribution
    L.control.attribution({
        position: 'bottomright',
        prefix: ''
    }).addTo(map);

    // Add a minimal style tile layer (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors, © CARTO'
    }).addTo(map);

    // Style the map container
    const mapElement = document.getElementById('map');
    mapElement.style.borderRadius = '8px';
    mapElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

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

                        // Add or update user marker with RED color
                        if (window.userMarker) {
                            window.userMarker.setLatLng(userLocation);
                        } else {
                            window.userMarker = L.circleMarker(userLocation, {
                                radius: 8,
                                fillColor: "#e74c3c", // RED for my location
                                color: "#fff",
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 0.8
                            }).addTo(map)
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

// Add markers for all toilets with BROWN styling
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

        // Use circleMarker with BROWN color for toilet reviews
        const marker = L.circleMarker(location, {
            radius: 8,
            fillColor: "#8B4513", // BROWN for toilet reviews
            color: "#fff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map)
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
        if (query.length === 0) {
            // If the search box is empty, show all markers and reset the map
            markers.forEach(markerData => {
                markerData.marker.addTo(map);
                markerData.card.style.display = 'block';
            });
            map.setView(defaultLocation, 13); // Reset to default location and zoom
            searchResults.style.display = 'none';
            return;
        }

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
                        // Use circle marker with BLUE color for search results
                        window.searchMarker = L.circleMarker(center, {
                            radius: 8,
                            fillColor: "#3388ff", // BLUE for search locations
                            color: "#fff",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).addTo(map)
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
            } else {
                // If radius is empty or invalid, show all markers
                markers.forEach(markerData => {
                    markerData.marker.addTo(map);
                    markerData.card.style.display = 'block';
                });
                map.setView(defaultLocation, 13); // Reset to default location and zoom
            }
        });
    }
}

// Filter markers by radius
function filterByRadius(center, radius) {
    const radiusInput = document.getElementById('radius-input');
    if (!radiusInput) return;

    radius = radius || parseFloat(radiusInput.value);
    if (isNaN(radius) || radius <= 0) {
        // If no radius is set, show all markers and reset the map view
        markers.forEach(markerData => {
            markerData.marker.addTo(map);
            markerData.card.style.display = 'block';
        });
        return;
    }

    // Filter markers based on the radius
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

    // Adjust the map's zoom level based on the radius
    const zoomLevel = calculateZoomLevel(radius);
    map.setView(center, zoomLevel);
}

// Helper function to calculate zoom level based on radius
function calculateZoomLevel(radius) {
    // Adjust these values based on your desired zoom behavior
    if (radius <= 1) return 15; // Very close zoom
    if (radius <= 5) return 13; // Close zoom
    if (radius <= 10) return 11; // Medium zoom
    if (radius <= 20) return 9; // Wide zoom
    return 7; // Very wide zoom
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

// Function to convert rating number to poop emojis
function getRatingEmojis(rating) {
    const poopEmoji = '💩';
    return poopEmoji.repeat(rating);
}

// Apply poop emojis to all cards
function updateRatingsToEmojis() {
    const ratingElements = document.querySelectorAll('.rating-emojis');
    ratingElements.forEach(element => {
        const rating = parseInt(element.getAttribute('data-rating'), 10);
        if (!isNaN(rating) && rating >= 0) {
            element.textContent = getRatingEmojis(rating);
        }
    });
}

// Make popups more minimal
function customizePopups() {
    const style = document.createElement('style');
    style.textContent = `
        .leaflet-popup-content-wrapper {
            border-radius: 4px;
            padding: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 14px;
        }
        .leaflet-popup-tip {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .leaflet-popup-content {
            margin: 6px 8px;
            line-height: 1.3;
        }
        .leaflet-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .leaflet-control-zoom a {
            border-radius: 4px;
            border: none;
            box-shadow: 0 1px 5px rgba(0,0,0,0.15);
        }
        .leaflet-control-attribution {
            font-size: 9px;
            background: rgba(255,255,255,0.7);
            padding: 3px 5px;
        }
    `;
    document.head.appendChild(style);
}

// Add this to the DOMContentLoaded event listener
document.getElementById('add-toilet-button').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude.toFixed(6);
            const lon = position.coords.longitude.toFixed(6);
            document.getElementById('location').value = `${lat},${lon}`;
            document.getElementById('toilet-form-modal').style.display = 'block';
        }, function(error) {
            alert("Could not get your location. Please check your browser permissions.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

// Close the modal when the close button is clicked
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('toilet-form-modal').style.display = 'none';
});

// Close the modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('toilet-form-modal')) {
        document.getElementById('toilet-form-modal').style.display = 'none';
    }
});

// Handle form submission
document.getElementById('toilet-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    // Add the current date if not provided
    if (!data.date) {
        data.date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Send data to Make.com webhook
    fetch('https://hook.eu2.make.com/cqwjb5cenvjpqcymbyx895iv7snr5glf', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            alert('Toilet submitted! Standby for approval');
            document.getElementById('toilet-form-modal').style.display = 'none';
            document.getElementById('toilet-form').reset();
        } else {
            alert('Error submitting form. Please try again.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('Error submitting form. Please try again.');
    });
});