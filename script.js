// Initialize the map
var map = L.map('map').setView([40.7128, -74.0060], 12); // Center on New York City

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Fetch the GeoJSON data
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        // Add all routes to the map
        addRoutesToMap(data);

        // Start the animation to update route weights
        startAnimation(data);
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to add all routes to the map
function addRoutesToMap(data) {
    // Create a layer for the routes
    const routeLayer = L.geoJSON(null).addTo(map);
    
    data.forEach((feature, index) => {
        L.geoJSON(feature, {
            style: {
                weight: getWeight(feature.estimated_average_ridership),
                opacity: 0.8
            }
        }).addTo(routeLayer);
    });
}

// Function to get weight based on ridership
function getWeight(ridership) {
    return Math.min(10, ridership / 1000); // Maximum weight is 10
}

// Function to start the animation
function startAnimation(data) {
    const routeLayer = L.geoJSON(null).addTo(map);
    routeLayer.addData(data);

    // Update weights periodically
    const updateInterval = 60000; // Update every minute (60000 milliseconds)
    setInterval(() => {
        updateWeights(routeLayer, data);
    }, updateInterval);
}

// Function to update the weights of routes
function updateWeights(layer, data) {
    layer.clearLayers(); // Clear existing routes

    // Re-add routes with updated weights
    data.forEach((feature, index) => {
        L.geoJSON(feature, {
            style: {
                weight: getWeight(feature.properties.ridership),
                opacity: 0.8
            }
        }).addTo(layer);
    });
}
