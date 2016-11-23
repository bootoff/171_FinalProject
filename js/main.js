// GLOBAL VARS ETC. ----------------------------------------------

// global variables for data
var centerOfMA = [42.358734, -71.849239], // Holden, MA -- for centering facilityMap
    citiesMA = [], // GeoJSON - cities in MA
    cnt = 0,
    facilityLocations = [], // lat, long for pilot program facilities
    ghg = {}, // GHG conversion rates for each FY
    GHGsum = 0.0,
    plants = []; // primary data set - pilot program results

// global variables for visualization instances
var facilityMap,
    co2Savings,
    usageCostScatter;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';




// WORK WITH DATA ------------------------------------------------

// load data asynchronously
queue()
    .defer(d3.csv, "data/regions_served.csv")
    .defer(d3.json, "data/mass_cities.json")
    .defer(d3.csv, "data/plants.csv")
    .defer(d3.csv, "data/ghg.csv")
    .await(wrangleData);

// clean up data
function wrangleData(error, regionsServed, massCities, plantsData, GHGdata) {
    if (!error) {
        // store loaded data
        citiesMA = massCities;
        facilityLocations = regionsServed;
        plants = plantsData;

        GHGdata.forEach(function (d) {
            ghg[d.FY] = d["GHG factor"];
        });

        // We decided to drop the Chelmsford data.
        plants = plants.filter(function (d) {
            return d.Facility != "Chelmsford Water District"
        });

        // SavingsUSD and SavingsKWh are derived from the Usage data, and there
        // seem to be errors.  I suggest that we drop the versions in the CSV and
        // just generate new versions, as needed.
        plants.forEach(function (d) {
            delete d.SavingsUSD;
            delete d.SavingsKWh;
        });

        plants.forEach(function (d) {
            if (d.ElectricityGenerationKWh != "") {
                d.GHG = (+d.ElectricityGenerationKWh) * ghg[d.FY];
            } else {
                d.GHG = "";
            }
            d.Rate = (+d.UsageUSD) / (+d.UsageKWh);
            if (d.USDperKWh != "") {
                if (Math.abs((d.Rate - d.USDperKWh) / d.USDperKWh) > 1e-1) {
                    cnt++;
                    //console.log(cnt, "Rate! ", "USDperKWh: ", d.USDperKWh, ", calcuated Rate: ", d.Rate.toFixed(4), d);
                }
            }
        });

        // console.log(plants);
        var nested = d3.nest()
            .key(function (d) {
                return d.Facility;
            })
            .key(function (d) {
                return d.Type;
            })
            .entries(plants);
        //console.log("nested", nested);

        nested.forEach(function (d) {
            d.values.forEach(function (data) {
                data.values.forEach(function (d2) {
                    if ((+d2.FY) >= 13) {
                        GHGsum += d2.GHG;
                    }
                });
                //console.log(d.key, "GHGsum: ", GHGsum);
            });
        });

        // numify "plants" data
        plants.forEach(function (d) {
            d.ElectricityGenerationKWh = +d.ElectricityGenerationKWh;
            d.GHGlbs = +d.GHGlbs;
            d.USDperKWh = +d.USDperKWh;
            d.UsageKWh = +d.UsageKWh;
            d.UsageUSD = +d.UsageUSD;
        });

        // numify facilityLocations (for waterMap.js)
        facilityLocations.forEach(function (d) {
            d.Latitude = +d.Latitude;
            d.Longitude = +d.Longitude;
            d["Towns served"] = d["Towns served"].split(',');
        });

        // create visualizations
        createVis();
    }
}

// INSTANTIATE VISUALIZATIONS ------------------------------------------------------------

// create visualizations
function createVis() {
    facilityMap = new FacilityMap("facility-map", facilityLocations, citiesMA, centerOfMA);
    co2Savings = new co2Savings("co2-Savings", GHGsum);
    usageCostScatter = new UsageCostScatter("usagecost-scatter", plants);
}