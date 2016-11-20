// GLOBAL VARS ETC. ----------------------------------------------

// global variables for waterMap
var facilityLocations = [],
    citiesMA = [],
    plants = [],
    ghg = {};

// Holden, MA (~center of Massachusetts) -- for center
var centerOfMA = [42.358734, -71.849239];

// global variables for visualization instances
var facilityMap;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';


// WORK WITH DATA ------------------------------------------------

// load data asynchronously
queue()
    .defer(d3.csv, "data/regions_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .defer(d3.csv, "data/plants.csv")
    .defer(d3.csv, "data/ghg.csv")
    .await(createVis);

var cnt = 0;
// clean up data and create visualizations
function createVis(error, regionsServed, massCities, plantsData, GHGdata) {

    facilityLocations = regionsServed;
    citiesMA = massCities;
    plants = plantsData;

    GHGdata.forEach(function(d){
	ghg[d.FY] = d["GHG factor"];
    });

    // SavingsUSD and SavingsKWh are derived from the Usage data, and there
    // seem to be errors.  I suggest that we drop the versions in the CSV and
    // just generate new versions, as needed.
    plants.forEach(function(d) { delete d.SavingsUSD; delete d.SavingsKWh; });

    plants.forEach(function(d) {
	if(d.ElectricityGenerationKWh != ""){
	    d.GHG = (+d.ElectricityGenerationKWh)*ghg[d.FY];
	}else{
	    d.GHG = "";
	}
	d.Rate = (+d.UsageUSD)/(+d.UsageKWh);
	if(d.USDperKWh != ""){
	    if(Math.abs((d.Rate-d.USDperKWh)/d.USDperKWh)>1e-1){
		cnt++;
		console.log(cnt, "Rate! ", "USDperKWh: ", d.USDperKWh, ", calcuated Rate: ", d.Rate.toFixed(4), d);
	    }
	}
    });

    console.log(plants);
    var nested = d3.nest()
    	.key(function(d) { return d.Type;})
	.key(function(d) { return d.Facility;})
	.entries(plants);
    console.log(nested);

    // waterMap.js clean up data
    facilityLocations.forEach(function(d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });

    // instantiate visualizations
    facilityMap = new FacilityMap("water-map", facilityLocations, citiesMA, centerOfMA);
}
