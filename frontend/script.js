var map = L.map("map", {
  center: [40.440624, -79.995888],

  zoom: 14
});
var FoodIcon = L.Icon.extend({
  options: {
    iconSize: [30, 30]
  }
});
var convIcon = new FoodIcon({
  iconUrl:
    "https://raw.githubusercontent.com/CodeForPittsburgh/food-access-map/master/app/images/convenience_store.png"
});
var freshIcon = new FoodIcon({
  iconUrl:
    "https://github.com/CodeForPittsburgh/food-access-map/blob/master/app/images/fresh_access.png?raw=true"
});
var superIcon = new FoodIcon({
  iconUrl:
    "https://github.com/CodeForPittsburgh/food-access-map/blob/master/app/images/supermarket.png?raw=true"
});
var otherIcon = new FoodIcon({
  iconUrl:
    "https://github.com/CodeForPittsburgh/food-access-map/blob/master/app/images/other.png?raw=true"
});
var farmerIcon = new FoodIcon({
  iconUrl:
    "https://github.com/CodeForPittsburgh/food-access-map/blob/master/app/images/farmers_market.png?raw=true"
});

function getIcon(type) {
  if (type === "supermarket") {
    return superIcon;
  }
  if (type === "convenience store") {
    return convIcon;
  }
  if (type === "fresh access") {
    return freshIcon;
  }
  if (type === "farmers market") {
    return farmerIcon;
  }

  return otherIcon;
}

var geojsonMarkerOptions = {
  radius: 4,
  fillColor: "#ff7800",
  color: "#000",
  weight: 1
};


/*

FMNP: "NA"
SNAP: 1
WIC: "NA"
address: "139 S Main Street"
city: "Washington"
county: "Allegheny"
data_issues: null
date_from: null
date_to: null
file_name: "food-data/Cleaned_data_files//additional_food_bucks_sites.csv"
food_bucks: 1
free_distribution: 0
fresh_produce: "NA"
group_id: "NA"
idField: 2
latitude: 40.172985
latlng_source: "Mapbox Geocode"
location_description: null
longitude: -80.246581
merged_record: 0
name: "MAIN STREET FARMERS MARKET"
open_to_spec_group: "open to all"
original_id: null
phone: null
source_file: "Additional Food Bucks sites.xlsx"
source_org: "The Food Trust"
state: "PA"
timestamp: "2021-08-29 00:33:43"
type: null
url: null
zip_code: 15301

*/


function onEachFeature(feature, layer) {
  // does this feature have a property named popupContent?
  if (feature.properties && feature.properties.name) {
    
    var description = ( !feature.properties.location_description || feature.properties.location_description == "other" ) ? "" : feature.properties.location_description;
    
    
    var popup = L.popup().setContent(
      "<div class='sourceOrg'>" + feature.properties.source_org + "</div>" +
        "<div class='featureName'>" + feature.properties.name + "</div>" +
        "<div class='descriptionTitle'><div>" +
        "<div class='locationDescription'>" + description + "</div>" +
        "<div class='locationAddress'>" + feature.properties.address + "<br>" +
        feature.properties.city + ", " +
        feature.properties.state + " " +
        feature.properties.zip_code +
        "<br><a target='_blank' href='https://www.google.com/maps/dir//" +
        feature.properties.address + " " +
        feature.properties.city + ", " +
        feature.properties.state + " " +
        feature.properties.zip_code +
        "'>Google Map Directions</a></div>" +
        (feature.properties.phone ? "<p><b>Phone: </b>" + feature.properties.phone + "</p>" : "") +
        (feature.properties.url ? "<p><b>Website: </b>" + "<a target='_blank' href='" +
            feature.properties.url + "'>" +
            feature.properties.url + "</a></p>" : "") +
        (feature.properties.FNMP != "NA" ? "FNMP</br>" : "") +
        (feature.properties.SNAP != "NA" ? "SNAP</br>" : "") +
        (feature.properties.food_bucks == "1" ? "Food Bucks</br>" : "") +
        (feature.properties.fresh_produce != "NA" ? "Fresh Produce" : "")
        
    );
    layer.bindPopup(popup);
  }
}
L.control.scale().addTo(map);

// Create a Tile Layer and add it to the map
//var tiles = new L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png').addTo(map);
var markers = new L.LayerGroup();
var foodLocations = new L.FeatureGroup();
var points = [];
var RADIUS = 1000;
var distanceLine = L.polyline([[0,0],[0,0]], {color: 'red'}).addTo(map);
var filterCircle = L.circle(L.latLng(40.440624, -79.995888), RADIUS, {
  opacity: 0,
  weight: 1,
  fillOpacity: 0.0,
  fillColor: "#CC9933",
  color: "#AA6600"
}).addTo(map);
var DescriptorControl = L.Control.extend({
    options: {
        // Default control position
        position: 'bottomleft'
    },
    onAdd: function (map) {
        // Create a container with classname and return it
        return L.DomUtil.create('div', 'descriptor-control');
    },
    setContent: function (content) {
        // Set the innerHTML of the container
        this.getContainer().innerHTML = content;
    }
});
var myDescriptorControl =  new DescriptorControl().addTo(map);
var descriptorContent = 
    "<div class='descriptorTitle'>Welcome to the Pittsburgh Food Access Map</div>" +
    "<div class='descriptorBody'>Click on the map to see food resources that are within walkable distance.</div>";
myDescriptorControl.setContent(descriptorContent);


//L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png", {
//  attribution:
//    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//}).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
$.get(
  "https://raw.githubusercontent.com/CodeForPittsburgh/food-access-map-data/master/food-data/processed-datasets/merged_datasets.csv",
  function (csvString) {
    // Use PapaParse to convert string to array of objects
    var data = Papa.parse(csvString, { header: true, dynamicTyping: true })
      .data;

    for (var i in data) {
      var row = data[i];
      points.push({
        type: "Feature",
        properties: {
          ...row
        },
        geometry: {
          type: "Point",
          coordinates: [row.longitude || 0, row.latitude || 0]
        }
      });
    }

    let allLocations = L.geoJson(points, {
      filter: (x) => true,
      onEachFeature,
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          ...geojsonMarkerOptions,
          icon: getIcon(feature.properties.type)
        });
      }
    }).addTo(map);
  }
);
var searchControl = new L.esri.Controls.Geosearch({zoomToResult:false}).addTo(map);
// let gjp = new L.geoJson(points);

foodLocations.addTo(map);
var results = new L.LayerGroup().addTo(map);

var animateCircle = function(){
  var _animCircleRadius = 0;
  var endpoints = [filterCircle.getLatLng(), filterCircle.getLatLng()];
  let timer = setInterval( function() {    
    _animCircleRadius += 50
    if (_animCircleRadius >= RADIUS ) {       
      clearInterval(timer); 
    } else {
      endpoints[1][0] += .01;
      map.removeLayer(distanceLine);
      filterCircle.setRadius(_animCircleRadius);
      // distanceLine = L.polyline( endpoints , {color: 'red'}).addTo(map);
    }
   }, 20);
}

var setSearchLocation = function( latlng ){
    // TODO - the default pan is pretty simplistic.  
    // Esri's zoomto is too fast and too close.
    // a nice pan will help the user follow where the map is panning to by providing enough distance context
    // to allow the user to reorient
    // also, should only pan if the new position is 
    // 1. off map or 2. 'near' edge of map or 3. past a threshold distance from previous point
    map.panTo(latlng, { duration: 1 } );
    filterCircle.setRadius(0);
    filterCircle.setLatLng(latlng);
    filterCircle.setStyle({ opacity: 0.9, fillOpacity: 0.25 });
    animateCircle();
    map.removeLayer(foodLocations); 
    foodLocations = L.geoJson(points, {
      filter: (x) =>
        latlng.distanceTo(
          L.latLng(x.geometry.coordinates[1], x.geometry.coordinates[0])
        ) < RADIUS,
      onEachFeature,
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          ...geojsonMarkerOptions,
          icon: getIcon(feature.properties.type),
          fillColor: "#28cc00",
          opacity: .4
        });
      }
    }).addTo(map);
    
}

searchControl.on("results", function (data) {
  results.clearLayers();
  for (var i = data.results.length - 1; i >= 0; i--) {
    results.addLayer(L.marker(data.results[i].latlng));
  }
  setSearchLocation(data.results[0].latlng);  
});

var locateOnClick = function( latlng ) {
  results.clearLayers();
  setSearchLocation(latlng);
  results.addLayer(L.marker(latlng));
}

var firstUse = true;

map.on('click', function(ev) {
    //alert(ev.latlng); // ev is an event object (MouseEvent in this case)
    if ( firstUse ) {
      var popup = L.popup().setContent("Clicking in the map will search for resources in a walkable distance. Try it!");
      popup.setLatLng(ev.latlng);
      map.openPopup(popup);
      popup.popupClose = function(){
        locateOnClick( ev.latlng );
      } 
      firstUse = false;
    } else {
      locateOnClick( ev.latlng );
    }
  /*
    if ( confirm('Would you like to search for nearby resources from here?') ){

    } else {}
    */
});

setTimeout(function () {
  $(".pointer").fadeOut("slow");
}, 3400);

// let llk = leafletKnn(gjp);
// let nearestPlaces = llk.nearest(L.latLng(40,-79,10));