//Initialize map centered on NYC
var map = L.map('map').setView([40.7128, -74.0060], 12);

//Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 18,
}).addTo(map);

//Fetch the data from the api
fetch('https://data.ny.gov/resource/jsu2-fbtj.json')
  .then(response => response.json())
  .then(data => {
      let stationCoords = {}; //Store station coordinates
      let ridershipData = []; //Store ridership flows

    // Process data to extract station coordinates and ridership
    data.forEach(record => {
      const fromStation = record.to_station_name;
      const toStation = record.to_station_name;
      const ridership = parseFloat(record.ridership_estimate);
      const fromLat = parseFloat(record.from_station_latitude);
      const fromLng = parseFloat(record.from_station_longitude);
      const toLat = parseFloat(record.to_station_latitude);
      const toLng = parseFloat(record.to_station_longitude);

      if(!stationCoords[fromStation]){
        stationCoords[fromStation] = [fromLat, fromLng];
      }
      if(!stationCoords[toStation]){
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
    function animateRidership(){
      if(currentTime < ridershipData.length){
        // Remove existing lines
        map.eachLayer(function(layer){
          if(layer instanceof L.Polyline){
            map.removeLayer(layer);
          }
        });

        // Add new lines representing ridership flow
        ridershipData.forEach((route, index) => {
          if(index === currentTime){
            L.polyline([route.fromCoords, route.toCoords],{
              color: getRidershipColor(route.ridership),
              weight: getRidershipWeight(route.ridership),
              opacity: 0.7
            }).addTo(map);
          }
        });
        currentTime++;
        setTimeout(animateRidership, 500); Animate every half second
      }
    }
    function getRidershipColor(ridership){
      return ridership > 1000.0 ? '#FF5733' :
        ridership > 500.0 ? '#FFC300' :
        ridership > 100.0 ? '#DAF7A6' :
        '#C70039'
    }
    function getRidershipWeight(ridership){
      return ridership > 1000.0 ? 5 :
        ridership > 500.0 ? 3 :
        ridership > 100.0 ? 2 :
        1
    }
    
  //Start animation
    animateRidership();
    
    
  }).catch(err => console.error('Error fetching data:', err));
