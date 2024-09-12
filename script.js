// Initialize the map
var map = L.map('map').setView([40.7128, -74.0060], 12); // Center on New York City

// Add CartoDB Light tiles as the base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Variables to hold data and map layers
let geojson = null;
let routeColors = [];
let hourlyData = {};
let currentTimeIndex = 0;
let currentDate = new Date(); // Current date and time for simulation

// Fetch the data from the provided URL
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        // Convert the data to GeoJSON format
        geojson = convertToGeoJSON(data);
        routeColors = generateUniqueColors(geojson.features.length);

        // Prepare data for each hour and date
        prepareHourlyData();

        // Start the animation
        startAnimation();
    })
    .catch(error => console.error('Error fetching data:', error));

// Convert the data to GeoJSON format
function convertToGeoJSON(data) {
    return {
        type: 'FeatureCollection',
        features: data.map((item, index) => ({
            type: 'Feature',
            properties: {
                origin: item.origin_station_complex_name,
                destination: item.destination_station_complex_name,
                ridership: parseFloat(item.estimated_average_ridership),
                timestamp: new Date(item.timestamp),
                index: index // Keep track of index for color mapping
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [parseFloat(item.origin_longitude), parseFloat(item.origin_latitude)],
                    [parseFloat(item.destination_longitude), parseFloat(item.destination_latitude)]
                ]
            }
        }))
    };
}

// Prepare hourly data
function prepareHourlyData() {
    geojson.features.forEach(feature => {
        const timeKey = feature.properties.timestamp.toISOString();
        if (!hourlyData[timeKey]) {
            hourlyData[timeKey] = [];
        }
        hourlyData[timeKey].push(feature);
    });
}

// Add routes to the map with unique colors
function addRoutesToMap(features) {
    const routeLayer = L.layerGroup().addTo(map);

    // Add routes for the current time
    L.geoJSON({
        type: 'FeatureCollection',
        features: features
    }, {
        style: feature => ({
            color: routeColors[feature.properties.index],
            weight: getWeight(feature.properties.ridership),
            opacity: 0.8
        })
    }).addTo(routeLayer);

    return routeLayer;
}

// Function to get weight based on ridership
function getWeight(ridership) {
    return Math.min(10, ridership / 0.5); // Example: Scale ridership to weight, max weight is 10
}

// Function to generate unique colors for routes
function generateUniqueColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i / numColors) * 360;
        colors.push(`hsl(${hue}, 100%, 50%)`);
    }
    return colors;
}

// Function to start the animation
function startAnimation() {
    let routeLayer = addRoutesToMap(hourlyData[Object.keys(hourlyData)[currentTimeIndex]]);

    setInterval(() => {
        // Clear existing routes
        routeLayer.clearLayers();

        // Update current time
        const timeKeys = Object.keys(hourlyData);
        currentTimeIndex = (currentTimeIndex + 1) % timeKeys.length;
        const currentTimeKey = timeKeys[currentTimeIndex];
        const features = hourlyData[currentTimeKey];

        // Add new routes for the updated time
        routeLayer = addRoutesToMap(features);

        // Simulate passage of one second in real time
        currentDate.setSeconds(currentDate.getSeconds() + 1);

    }, 1000); // Update every second (1000 milliseconds)
}

// Initialize and display routes
prepareHourlyData(); // Prepare data before starting the animation
startAnimation();
