// GLOBAL VARS ETC. ----------------------------------------------

// global variables for primary datasets
var citiesMA = [], // geoJSON - cities in MA
    dataByFacility = [], // array[19] of facilities and respective data
    facilityLocations = [], // lat, long for pilot program facilities
    plants = [], // primary data set - pilot program results
    SummaryData = []; //

// global variables - miscellaneous
var centerOfMA = [42.358734, -71.849239], // Holden, MA -- for centering facilityMap
    cnt = 0,
    ghg = {}, // GHG conversion rates for each FY
    GHGsum = 0.0,
    NumYears = {},
    defaultUSDperKWh = 0.20,
    metricTonsPerLb = 0.000453592;

// global variables for visualization instances
var facilityMap,
    co2Savings,
    usageCostScatter;

// specify path to Leaflet images: in [dir]/img
L.Icon.Default.imagePath = 'img/';




// INSTANTIATE VISUALIZATIONS ------------------------------------------------------------

// create visualizations
function createVis() {
    facilityMap = new FacilityMap("facility-map", facilityLocations, citiesMA, centerOfMA);
    co2Savings = new co2Savings("co2-Savings", GHGsum);
    usageCostScatter = new UsageCostScatter("usagecost-scatter", plants, dataByFacility);
}




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

        // wrangle "plants" dataset
        wranglePlants();

        // wrangle "dataByFacility" dataset
        wrangleDataByFacility();

        // wrangle "SummaryData" dataset
        wrangleSummaryData();

        // wrangle data for facilityMap.js
        wrangleFacilityMap();

        // Make the ghg factor dictionary.
        GHGdata.forEach(function (d) {
            ghg[d.FY] = d["GHG factor"];
        });

        // create visualizations
        createVis();
    }
}

// wrangle "plants" dataset
function wranglePlants() {
    plants.forEach(function (d) {
        d.ElectricityGenerationKWh = +d.ElectricityGenerationKWh;
        d.GHGlbs = +d.GHGlbs;
        d.USDperKWh = +d.USDperKWh;
        d.UsageKWh = +d.UsageKWh;
        d.UsageUSD = +d.UsageUSD;
    });

    // We decided to drop the Chelmsford data.
    plants = plants.filter(function(d){ return d.Facility!="Chelmsford Water District" });

    // SavingsUSD and SavingsKWh are derived from the Usage data, and there
    // seem to be errors.  I suggest that we drop the versions in the CSV and
    // just generate new versions, as needed.
    //
    plants.forEach(function(d) {
        delete d.SavingsUSD;
        delete d.SavingsKWh;
    });

    // Computing GHG emissions from primary data, rather than using
    // the values in the excel sheets.
    plants.forEach(function(d) {
        if(d.ElectricityGenerationKWh != ""){
            d.GHG = (+d.ElectricityGenerationKWh)*ghg[d.FY];
        }else{
            d.GHG = "";
        }
    });

    // Regularizing the cost rates
    plants.forEach(function(d) {

        // There are a few missing UsageUSD values;
        // fill them in where possible.
        if(d.UsageUSD == "" && d.UsageKWh != "" && d.USDperKWh != ""){
            d.UsageUSD = (+d.UsageKWh) * (+d.USDperKWh);
        }

        if(d.USDperKWh != ""){
            // If there as a rate in the csv file, use it.
            d.Rate = (+d.USDperKWh);
        }else if(d.UsageUSD != "" && d.UsageKWh != ""){
            // If the rate is missing in the csv file but we
            // have the usage in USD and KWh, compute the rate
            d.Rate = (+d.UsageUSD)/(+d.UsageKWh);
        }else {
            // Otherwise, just assume a defaultUSDperKWh;
            d.Rate = defaultUSDperKWh;
        }
    });
}

// create "dataByFacility" dataset
function wrangleDataByFacility() {
    // get unique names of facilities
    var uniqueFacilities = d3.map(plants, function(d) {
        return d.Facility;
    }).keys();

    // put unique facilities into array of objects
    dataByFacility = uniqueFacilities.map(function(d) {
        return {
            "id": d,
            "values": []
        };
    });

    // populate each facility object with data by FY
    dataByFacility.forEach(function(d) {
        d.values = plants.filter(function(d2) {
            if (d.id == d2.Facility)
                return d;
        });
    });
}

// wrangle "SummaryData" dataset
function wrangleSummaryData() {
    console.log(plants);
    var nested = d3.nest()
        .key(function(d) { return d.Facility;})
        .entries(plants);

    nested.forEach(function(d, index){
        SummaryData[index] = {};
        SummaryData[index].savings_USD_sum = 0.0;
        SummaryData[index].ghg_sum = 0.0;
        SummaryData[index].num_years = 0;
        SummaryData[index].key = d.key;
        SummaryData[index].energy_sum = 0.0;
        SummaryData[index].usage_sum = 0.0;

        d.values.forEach(function(data, i2){

            if(data.ElectricityGenerationKWh != "" && (+data.FY)>=10){

                SummaryData[index].ghg_sum += data.GHG*metricTonsPerLb;
                SummaryData[index].energy_sum += (+data.ElectricityGenerationKWh);
                SummaryData[index].usage_sum  += (+data.UsageKWh);
                SummaryData[index].savings_USD_sum += (+data.ElectricityGenerationKWh)*(+data.Rate);
                SummaryData[index].num_years  += 1;
            }
        });
    });

    var SavingsKWh = 0;
    var SavingsUSD = 0;
    var SavingsGHG = 0;

    SummaryData.forEach(function(data, index){
        SavingsKWh += data.energy_sum;
        SavingsUSD += data.savings_USD_sum;
        SavingsGHG += data.ghg_sum;
    });
    console.log("Savings (Millions of KWH): ", SavingsKWh/1e6, "Savings (Millions USD): ", SavingsUSD/1e6, "Savings (Tons): ", SavingsGHG);

    console.log(SummaryData);
}

// wrangle data for facilityMap.js
function wrangleFacilityMap() {
    facilityLocations.forEach(function (d) {
        d.Latitude = +d.Latitude;
        d.Longitude = +d.Longitude;
        d["Towns served"] = d["Towns served"].split(',');
    });
}