// Initialize the map
var map = L.map('map').setView([40.7128, -74.0060], 12); // Center on New York City

// Add CartoDB Light tiles as the base layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Fetch the data from the provided URL
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        // Convert the data to GeoJSON format
        const geojson = convertToGeoJSON(data);

        // Generate unique colors for each route
        const routeColors = generateUniqueColors(geojson.features.length);

        // Add routes to the map
        addRoutesToMap(geojson, routeColors);

        // Optionally, you can add dynamic animation for updating weights
        // For demonstration purposes, we're not adding dynamic animation here
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

// Add routes to the map with unique colors
function addRoutesToMap(geojson, routeColors) {
    L.geoJSON(geojson, {
        style: feature => ({
            color: routeColors[feature.properties.index],
            weight: getWeight(feature.properties.ridership),
            opacity: 0.8
        })
    }).addTo(map);
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
