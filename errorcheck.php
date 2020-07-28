<?php

// display errors
ini_set("allow_url_fopen", 1);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// connect to database
global $mysqli;
$mysqli = new mysqli("foo", "bar");
if ($mysqli -> connect_errno) {
    echo "Failed to connect to MySQL: " . $mysqli -> connect_error;
    exit();
}

echo ("starting error checks, this takes a few minutes <br><br>");

// get current local time
date_default_timezone_set('America/Los_Angeles');
$datetime_now = date('Y-m-d H:i:s');


/*
*
*  Check site_score, station, grid matches
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkUpdate<br>");

function checkUpdate ($site_score, $station, $gridX, $gridY) {
    global $mysqli;
    $query1 = "SELECT site_score, station, gridX, gridY FROM weather_forecast WHERE site_score = '$site_score'";
    $result = $mysqli->query($query1);
    $row_cnt = $result->num_rows;
    // make sure site is in database
    if ($row_cnt == 0) {
        echo("can not find ".$site_score." in database");
    }
        // look for matching error
        while($row = $result->fetch_assoc()) {
            if ($station != $row["station"]) {
                echo ("<div class='errorcheck'>ERROR checkUpdate station for ".$site_score." station ".$station."</div><br><br>");
            }

            if ($gridX != $row["gridX"]) {
                echo ("<div class='errorcheck'>ERROR checkUpdate gridX for ".$site_score." gridX ".$gridX."</div><br><br>");
            }

            if ($gridY != $row["gridY"]) {
                echo ("<div class='errorcheck'>ERROR checkUpdate gridY for ".$site_score." station ".$gridY."</div><br><br>");
            }

    }
}



/*
*
*  Check for site_name duplicates
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkDuplicate<br>");
function checkDuplicate () {
    global $mysqli;
    $query1 = "SELECT * FROM weather_forecast GROUP BY site_score HAVING COUNT(site_score) > 1";
    $result = $mysqli->query($query1);
    while($row = $result->fetch_assoc()) {
        echo ("<div class='errorcheck'>ERROR checkDuplicate, duplicate site_score  --> ".$row['site_score']."</div><br><br>");
    }
}
checkDuplicate();

/*
*
*  Find sites not being updated date_update field
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkupdateStamp<br>");

function checkupdateStamp () {

    $datetime_now = date('Y-m-d H:i:s');
    global $mysqli;
    $query = "SELECT site_score, update_date FROM weather_forecast";
    $result = $mysqli->query($query);
    while($row = $result->fetch_assoc()) {

        $site_score = $row['site_score'];
        $date1 = new DateTime($row['update_date']);
        $date2 = new DateTime($datetime_now);
        $diff = $date2->diff($date1)->format("%d");

        if ($diff > 1) {
            echo ("<div class='errorcheck'>ERROR checkupdateStamp --> ".$site_score." is not updating</div><br><br>");
        }
    }
}
checkupdateStamp();




/*
*
*  Find sites not being updated json_wind
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkjsonWind<br><br>");

function checkjsonWind () {

    $datetime_now = date('Y-m-d H:i:s');
    global $mysqli;
    $json_array = array();

    $query = "SELECT site_score, json_wind FROM weather_forecast";
    $result = $mysqli->query($query);
    while($row = $result->fetch_array(MYSQLI_ASSOC)) {

        $site_score = $row['site_score'];
        $json_wind = $row['json_wind'];
        $json_array = json_decode($json_wind, true); // create array
        $json_time = $json_array['properties']['updated']; // get updated datetime in json_wind

        $date1 = new DateTime($json_time);
        $date2 = new DateTime($datetime_now);
        $diff = $date2->diff($date1)->format("%d");

        if ($diff > 1) {
            echo ("<div class='errorcheck'>ERROR checkjsonWind --> ".$site_score." is is  ".$diff." days old</div><br>");
        }
    }
}
checkjsonWind();


/*
*
*  Find sites not being updated json_lift
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkjsonLift<br>");

function checkjsonLift () {

    $datetime_now = date('Y-m-d H:i:s');
    global $mysqli;
    $json_array = array();

    $query = "SELECT site_score, json_lift FROM weather_forecast";
    $result = $mysqli->query($query);
    while($row = $result->fetch_array(MYSQLI_ASSOC)) {

        $site_score = $row['site_score'];
        $json_lift = $row['json_lift'];
        $json_array = json_decode($json_lift, true); // create array
        $json_time = $json_array['properties']['updateTime']; // get updated datetime in json_lift

        $date1 = new DateTime($json_time);
        $date2 = new DateTime($datetime_now);
        $diff = $date2->diff($date1)->format("%d");

        if ($diff > 1) {
            echo ("<div class='errorcheck'>ERROR checkjsonLift --> ".$site_score." is is  ".$diff." days old <br>");
        }
    }
}
checkjsonLift();



/*
*
*  lat, lng needs to match station, gridX, gridY
*
*/
echo "------------------------------------------";
echo ("<br><br><br>checkLatlng<br>");
function checkLatlng ($site_score, $station, $gridX, $gridY, $lat, $lng) {

    // get station, gridx and gridy from NWS


        $url = "https://api.weather.gov/points/".$lat.",".$lng;

        $context = stream_context_create(
            array(
                "http" => array(
                    "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
                )
            )
        );
        $result = file_get_contents($url, false, $context);

        //call api
        $json = json_decode($result);
        $cwa_api = $json->properties->cwa;
        $gridx_api = $json->properties->gridX;
        $gridy_api= $json->properties->gridY;

        if ($station != $cwa_api || $gridx_api != $gridX || $gridy_api != $gridY) {

            echo ("ERROR checkLatLng ".$site_score." station, lat, lng not matching");
        }

}




$site_score = "big_sur_score";
$lat = 35.971;
$lng = -121.453;
$station = "MTR";
$gridX =  106;
$gridY =  40;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "berkeley_score";
$lat = 37.871;
$lng = -122.319;
$station = "MTR";
$gridX =  92;
$gridY =  130;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "blue_rock_score";
$lat = 38.1384;
$lng = -122.1959;
$station = "STO";
$gridX =  12;
$gridY =  53;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "channing_score";
$lat = 38.098;
$lng = -122.180;
$station = "STO";
$gridX =  12;
$gridY =  51;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "channing_east_score";
$lat = 38.099;
$lng = -122.180;
$station = "STO";
$gridX =  12;
$gridY =  51;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "coloma_score";
$lat = 38.822;
$lng = -120.889;
$station = "STO";
$gridX =  63;
$gridY =  74;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "davis_score";
$lat = 38.570;
$lng = -121.820;
$station = "STO";
$gridX =  29;
$gridY =  69;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "diablo_juniper_score";
$lat = 37.881;
$lng = -121.914;
$station = "MTR";
$gridX =  106;
$gridY =  127;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "diablo_towers_score";
$lat = 37.881;
$lng = -121.914;
$station = "MTR";
$gridX =  106;
$gridY =  127;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "drakes_score";
$lat = 38.0265;
$lng = -122.9634;
$station = "MTR";
$gridX =  71;
$gridY =  141;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "dunlap_score";
$lat = 36.765;
$lng = -119.098;
$station = "HNX";
$gridX =  76;
$gridY =  96;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "ed_levin_score";
$lat = 37.475;
$lng = -121.861;
$station = "MTR";
$gridX =  104;
$gridY =  109;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "elk_score";
$lat = 39.277;
$lng = -122.941;
$station = "EKA";
$gridX =  88;
$gridY =  30;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "goat_score";
$lat = 38.443;
$lng = -123.122;
$station = "MTR";
$gridX =  69;
$gridY =  161;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "grade_score";
$lat = 38.478;
$lng = -123.163;
$station = "MTR";
$gridX =  68;
$gridY =  163;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "hat_creek_score";
$lat = 40.842;
$lng = -121.428;
$station = "STO";
$gridX =  62;
$gridY =  167;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "hull_score";
$lat = 39.509;
$lng = -122.937;
$station = "EKA";
$gridX =  91;
$gridY =  40;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "indianvalley_score";
$lat = 40.194;
$lng = -120.923;
$station = "REV";
$gridX =  12;
$gridY =  142;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lagoonkite_score";
$lat = 38.333;
$lng = -122.002;
$station = "STO";
$gridX =  20;
$gridY =  60;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lagoon_score";
$lat = 38.333;
$lng = -122.002;
$station = "STO";
$gridX =  20;
$gridY =  60;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "musselrock_score";
$lat = 37.674;
$lng = -122.495;
$station = "MTR";
$gridX =  84;
$gridY =  122;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "mt_tam_score";
$lat = 37.911;
$lng = -122.625;
$station = "MTR";
$gridX =  82;
$gridY =  134;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "mission_score";
$lat = 37.518;
$lng = -121.892;
$station = "MTR";
$gridX =  104;
$gridY =  111;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "oroville_score";
$lat = 39.537;
$lng = -121.628;
$station = "STO";
$gridX =  44;
$gridY =  111;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "poplar_score";
$lat =  37.4554;
$lng = -122.4447;
$station = "MTR";
$gridX =  84;
$gridY =  112;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "potato_score";
$lat = 39.3317;
$lng = -122.685;
$station = "STO";
$gridX =  6;
$gridY =  109;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "sandybeach_score";
$lat =  38.0772;
$lng = -122.2398;
$station = "STO";
$gridX =  10;
$gridY =  50;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "sand_city_score";
$lat = 36.626;
$lng = -121.844;
$station = "MTR";
$gridX =  98;
$gridY =  72;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "shoreline_score";
$lat = 37.430;
$lng = -122.076;
$station = "MTR";
$gridX =  97;
$gridY =  109;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "st_helena_score";
$lat = 38.667;
$lng = -122.628;
$station = "MTR";
$gridX =  89;
$gridY =  167;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "tollhouse_score";
$lat = 37.015;
$lng = -119.373;
$station = "HNX";
$gridX =  68;
$gridY =  109;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "vacaridge_score";
$lat = 38.400;
$lng = -122.106;
$station = "MTR";
$gridX =  104;
$gridY =  152;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "vallejo_score";
$lat = 38.102;
$lng = -122.264;
$station = "STO";
$gridX =  9;
$gridY =  51;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "waddel_score";
$lat = 37.089;
$lng = -122.274;
$station = "MTR";
$gridX =  87;
$gridY =  95;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "windy_score";
$lat = 37.364;
$lng = -122.245;
$station = "MTR";
$gridX =  90;
$gridY =  107;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);


$site_score = "day_dreams_score";
$lat = 39.242;
$lng = -120.008;
$station = "REV";
$gridX =  35;
$gridY =  94;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "duck_hill_score";
$lat = 39.241;
$lng = -119.741;
$station = "REV";
$gridX =  44;
$gridY =  92;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "kingsbury_score";
$lat = 38.981;
$lng = -119.852;
$station = "REV";
$gridX =  38;
$gridY =  81;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "peavine_score";
$lat = 39.590;
$lng = -119.929;
$station = "REV";
$gridX =  40;
$gridY =  109;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "rainbow_east_score";
$lat = 39.694;
$lng = -119.983;
$station = "REV";
$gridX =  39;
$gridY =  114;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "rainbow_west_score";
$lat = 39.694;
$lng = -119.983;
$station = "REV";
$gridX =  39;
$gridY =  114;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "slide_score";
$lat = 39.319;
$lng = -119.867;
$station = "REV";
$gridX =  40;
$gridY =  96;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "owens_walts_score";
$lat =  36.4727;
$lng = -118.1150;
$station = "VEF";
$gridX =  18;
$gridY =  127;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "owens_lee_score";
$lat = 37.9763;
$lng = -119.1680;
$station = "REV";
$gridX =  54;
$gridY =  32;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "shasta_score";
$lat = 41.377;
$lng = -122.195;
$station = "MFR";
$gridX =  116;
$gridY =  28;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "whaleback_score";
$lat = 41.535;
$lng = -122.153;
$station = "MFR";
$gridX =  119;
$gridY =  34;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "woodrat_score";
$lat = 42.2313;
$lng = -123.0037;
$station = "MFR";
$gridX =  97;
$gridY =  71;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lakeview_blackcap_score";
$lat = 42.204264;
$lng = -120.330122;
$station = "MFR";
$gridX =  186;
$gridY =  52;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lakeview_dohertyslide_score";
$lat = 42.019267;
$lng = -119.485666;
$station = "MFR";
$gridX =  213;
$gridY =  39;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lakeview_sugarhill_score";
$lat = 41.806527;
$lng = -120.328704;
$station = "MFR";
$gridX =  183;
$gridY =  35;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "lakeview_hadleybutte_score";
$lat = 42.690833;
$lng = -120.666117;
$station = "MFR";
$gridX =  179;
$gridY =  77;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "pine_score";
$lat = 43.819367;
$lng = -120.932833;
$station = "PDT";
$gridX =  45;
$gridY =  27;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "marshall_score";
$lat = 34.2101;
$lng = -117.3028;
$station = "SGX";
$gridX =  61;
$gridY =  79;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "parma_score";
$lat = 34.4827;
$lng = -119.7146;
$station = "LOX";
$gridX =  104;
$gridY =  72;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "more_mesa_score";
$lat = 34.4197;
$lng = -119.7897;
$station = "LOX";
$gridX =  101;
$gridY =  70;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "bates_score";
$lat = 34.3820;
$lng = -119.4841;
$station = "LOX";
$gridX =  112;
$gridY =  66;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "cayucos_score";
$lat = 35.4281;
$lng = -120.8729;
$station = "LOX";
$gridX =  71;
$gridY =  121;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "cuesta_score";
$lat = 35.2932;
$lng = -120.6449;
$station = "LOX";
$gridX =  78;
$gridY =  114;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "mdo_score";
$lat = 35.2932;
$lng = -120.8780;
$station = "LOX";
$gridX =  69;
$gridY =   116;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);

$site_score = "laguna_score";
$lat = 35.2691;
$lng = -120.6838;
$station = "LOX";
$gridX =  76;
$gridY =  113;
checkUpdate ($site_score, $station, $gridX, $gridY);
checkLatLng ($site_score, $station, $gridX, $gridY, $lat, $lng);



$mysqli->close();




?>
