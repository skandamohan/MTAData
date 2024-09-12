// Initialize the map
var map = L.map('map').setView([40.7128, -74.0060], 12); // Center on New York City

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Fetch the GeoJSON data
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        // Generate unique colors for each route
        const routeColors = generateUniqueColors(data.features.length);

        // Add all routes to the map with unique colors
        addRoutesToMap(data, routeColors);

        // Start the animation to update route weights
        startAnimation(data, routeColors);
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to generate unique colors for routes
function generateUniqueColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        // Generate a unique color (e.g., using a color wheel)
        const hue = (i / numColors) * 360;
        colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
}

// Function to add all routes to the map
function addRoutesToMap(data, routeColors) {
    // Create a layer for the routes
    const routeLayer = L.geoJSON(null).addTo(map);
    
    // Add each route with its unique color
    data.features.forEach((feature, index) => {
        L.geoJSON(feature, {
            style: {
                color: routeColors[index],
                weight: getWeight(feature.properties.ridership),
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
function startAnimation(data, routeColors) {
    const routeLayer = L.geoJSON(null).addTo(map);
    routeLayer.addData(data);

    // Update weights periodically
    const updateInterval = 60000; // Update every minute (60000 milliseconds)
    setInterval(() => {
        updateWeights(routeLayer, data, routeColors);
    }, updateInterval);
}

// Function to update the weights of routes
function updateWeights(layer, data, routeColors) {
    layer.clearLayers(); // Clear existing routes

    // Re-add routes with updated weights
    data.features.forEach((feature, index) => {
        L.geoJSON(feature, {
            style: {
                color: routeColors[index],
                weight: getWeight(feature.properties.ridership),
                opacity: 0.8
            }
        }).addTo(layer);
    });
}
