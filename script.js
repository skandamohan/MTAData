// Initialize map centered on NYC
var map = L.map('map').setView([40.7128, -74.0060], 12);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Fetch station-to-station ridership data from the API
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
    .then(response => response.json())
    .then(data => {
        let stationCoords = {};  // Store station coordinates
        let ridershipData = [];  // Store ridership flows
        
        // Process data to extract station coordinates and ridership
        data.forEach(record => {
            const fromStation = record.from_station_name;
            const toStation = record.to_station_name;
            const ridership = parseInt(record.estimated_average_ridership);
            const fromLat = parseFloat(record.origin_latitude);
            const fromLng = parseFloat(record.origin_longitude);
            const toLat = parseFloat(record.destination_latitude);
            const toLng = parseFloat(record.destination_longitude);
            
            if (!stationCoords[fromStation]) {
                stationCoords[fromStation] = [fromLat, fromLng];
            }
            if (!stationCoords[toStation]) {
                stationCoords[toStation] = [toLat, toLng];
            }
            
            ridershipData.push({
                fromCoords: [fromLat, fromLng],
                toCoords: [toLat, toLng],
                ridership: ridership
            });
        });

        // Function to animate ridership between stations
        let currentTime = 0;
        function animateRidership() {
            if (currentTime < ridershipData.length) {
                // Remove existing lines
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Polyline) {
                        map.removeLayer(layer);
                    }
                });

                // Add new lines representing ridership flow
                ridershipData.forEach((route, index) => {
                    if (index === currentTime) {
                        L.polyline([route.fromCoords, route.toCoords], {
                            color: getRidershipColor(route.ridership),
                            weight: getRidershipWeight(route.ridership),
                            opacity: 0.7
                        }).addTo(map);
                    }
                });

                currentTime++;
                setTimeout(animateRidership, 1000);  // Animate every second
            }
        }

        // Start animation
        animateRidership();

        // Function to determine line color based on ridership value
        function getRidershipColor(ridership) {
            return ridership > 1000 ? '#FF5733' :
                   ridership > 500 ? '#FFC300' :
                   ridership > 100 ? '#DAF7A6' :
                   '#C70039';
        }

        // Function to determine line weight based on ridership value
        function getRidershipWeight(ridership) {
            return ridership > 1000 ? 5 :
                   ridership > 500 ? 3 :
                   ridership > 100 ? 2 :
                   1;
        }
    })
    .catch(err => console.error('Error fetching data:', err));
