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
let scheduleData = {};
let currentPeriod = null;
let currentHourIndex = 0;
let currentDayIndex = 0;
let currentMonthIndex = 0;
let currentYearIndex = 0;
let periodKeys = [];
let dayKeys = [];
let monthKeys = [];
let yearKeys = [];

// Fetch the data from the provided URL
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        // Convert the data to GeoJSON format and prepare for animation
        geojson = convertToGeoJSON(data);
        routeColors = generateUniqueColors(geojson.features.length);
        prepareScheduleData();

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
                year: item.year,
                month: item.month,
                day_of_week: item.day_of_week,
                hour_of_day: item.hour_of_day,
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

// Prepare the schedule data
function prepareScheduleData() {
    // Group data by year, month, day_of_week, and hour_of_day
    geojson.features.forEach(feature => {
        const key = `${feature.properties.year}-${feature.properties.month}-${feature.properties.day_of_week}-${feature.properties.hour_of_day}`;
        if (!scheduleData[key]) {
            scheduleData[key] = [];
        }
        scheduleData[key].push(feature);
    });

    // Extract unique periods and order them
    periodKeys = Object.keys(scheduleData).sort();
    const firstKey = periodKeys[0];
    const { year, month, day_of_week } = parsePeriodKey(firstKey);

    // Initialize indices for animation
    yearKeys = [...new Set(periodKeys.map(key => key.split('-')[0]))].sort();
    monthKeys = [...new Set(periodKeys.map(key => key.split('-')[1]))].sort();
    dayKeys = [...new Set(periodKeys.map(key => key.split('-')[2]))].sort();
}

// Parse period key into components
function parsePeriodKey(key) {
    const [year, month, day_of_week, hour_of_day] = key.split('-');
    return { year, month, day_of_week, hour_of_day };
}

// Add routes to the map with unique colors
function addRoutesToMap(features) {
    const routeLayer = L.layerGroup().addTo(map);

    // Add routes for the current period
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
    let routeLayer = addRoutesToMap(scheduleData[periodKeys[currentHourIndex]]);

    setInterval(() => {
        // Clear existing routes
        routeLayer.clearLayers();

        // Update to the next hour
        currentHourIndex++;
        if (currentHourIndex >= periodKeys.length) {
            currentHourIndex = 0;
            currentDayIndex++;
            if (currentDayIndex >= dayKeys.length) {
                currentDayIndex = 0;
                currentMonthIndex++;
                if (currentMonthIndex >= monthKeys.length) {
                    currentMonthIndex = 0;
                    currentYearIndex++;
                    if (currentYearIndex >= yearKeys.length) {
                        currentYearIndex = 0;
                    }
                }
            }
        }

        const year = yearKeys[currentYearIndex];
        const month = monthKeys[currentMonthIndex];
        const day_of_week = dayKeys[currentDayIndex];
        const periodKey = `${year}-${month}-${day_of_week}-${periodKeys[currentHourIndex].split('-')[3]}`;
        
        if (scheduleData[periodKey]) {
            routeLayer = addRoutesToMap(scheduleData[periodKey]);
        }

    }, 1000); // Update every second (1000 milliseconds)
}

// Initialize and display routes
prepareScheduleData(); // Prepare data before starting the animation
startAnimation();
