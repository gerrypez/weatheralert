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

echo ("starting cron job <br><br>");

// get update time
date_default_timezone_set('America/Los_Angeles');
$datetime_updating = date('Y-m-d H:i:s');  // ex. 2020-07-20 14:55:18


//  PROBLEM --> inserts 500 errors

function getWind ($site_score, $station, $gridX, $gridY, $datetime_updating) {

    $gridX = intval($gridX);
    $gridY = intval($gridY);

    global $mysqli;

    // echo ($site_score." ".$station." ".$gridX." ".$gridY."<br>");

    $url = "https://api.weather.gov/gridpoints/".$station."/".$gridX.",".$gridY."/forecast/hourly";

    $context = stream_context_create(
        array(
            "http" => array(
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
            )
        )
    );
    $result = file_get_contents($url, false, $context);
    // $result_new = json_encode($result);

    $result_length = strlen($result);

    // Test if string contains the word
    if( $result_length < 80000 ){

        // API call time out or not responsive
        echo "ERROR getWind unexpected problem ".$site_score.":  ".$url." and string length is".$result_length."<br>";

    } else {

        $json_wind = json_encode($result); // encode to json for updating db

        // update mysql table
        $mysqli->query("UPDATE weather_forecast
        SET update_date = '$datetime_updating', json_wind = $json_wind
        WHERE site_score = '$site_score'");

        // echo is returned to javascript page
        echo "getWind success ".$site_score. "  ". $station. "  ". $gridX. "  ". $gridY."<br>";
    }

}

function getLift ($site_score, $station, $gridX, $gridY, $datetime_updating) {

    $gridX = intval($gridX);
    $gridY = intval($gridY);

    global $mysqli;

    // echo ($site_score." ".$station." ".$gridX." ".$gridY."<br>");

    $url = "https://api.weather.gov/gridpoints/".$station."/".$gridX.",".$gridY;

    $context = stream_context_create(
        array(
            "http" => array(
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36"
            )
        )
    );
    $result = file_get_contents($url, false, $context);
    // $result_new = json_encode($result);

    $result_length = strlen($result);

    // Test if string contains the word
    if( $result_length < 80000 ){

        // API call time out or not responsive
        echo " ERROR **** getLift unexpected problem ".$site_score." and result_length = ".$result_length."<br>";

    } else {

        $json_lift = json_encode($result); // encode to json for updating db

        // update mysql table
        $mysqli->query("UPDATE weather_forecast
        SET update_date = '$datetime_updating', json_lift = $json_lift
        WHERE site_score = '$site_score'");

        // echo is returned to javascript page
        echo "getLift success ".$site_score. "  ". $station. "  ". $gridX. "  ". $gridY."<br><br>";
    }

}

$site_score = "big_sur_score";
$station = "MTR";
$gridX = 106;
$gridY = 40;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "berkeley_score";
$station = "MTR";
$gridX = 92;
$gridY = 130;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "blue_rock_score";
$station = "STO";
$gridX = 12;
$gridY = 53;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "channing_score";
$station = "STO";
$gridX = 12;
$gridY = 51;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "channing_east_score";
$station = "STO";
$gridX = 12;
$gridY = 51;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "coloma_score";
$station = "STO";
$gridX = 63;
$gridY = 74;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "davis_score";
$station = "STO";
$gridX = 29;
$gridY = 69;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "diablo_juniper_score";
$station = "MTR";
$gridX = 106;
$gridY = 127;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "diablo_towers_score";
$station = "MTR";
$gridX = 106;
$gridY = 127;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "drakes_score";
$station = "MTR";
$gridX = 71;
$gridY = 141;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "duck_hill_score";
$station = "REV";
$gridX = 44;
$gridY = 92;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "dunlap_score";
$station = "HNX";
$gridX = 76;
$gridY = 96;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "ed_levin_score";
$station = "MTR";
$gridX = 104;
$gridY = 109;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "elk_score";
$station = "EKA";
$gridX = 88;
$gridY = 30;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "goat_score";
$station = "MTR";
$gridX = 69;
$gridY = 161;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "grade_score";
$station = "MTR";
$gridX = 68;
$gridY = 163;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "hat_creek_score";
$station = "STO";
$gridX = 62;
$gridY = 167;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "hull_score";
$station = "EKA";
$gridX = 91;
$gridY = 40;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "indianvalley_score";
$station = "REV";
$gridX = 12;
$gridY = 142;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lagoonkite_score";
$station = "STO";
$gridX = 20;
$gridY = 60;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lagoon_score";
$station = "STO";
$gridX = 20;
$gridY = 60;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "musselrock_score";
$station = "MTR";
$gridX= 84;
$gridY = 122;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "mt_tam_score";
$station = "MTR";
$gridX= 82;
$gridY = 134;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "mission_score";
$station = "MTR";
$gridX= 104;
$gridY = 111;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "oroville_score";
$station = "STO";
$gridX= 44;
$gridY = 111;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "poplar_score";
$station = "MTR";
$gridX = 84;
$gridY = 112;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "potato_score";
$station = "STO";
$gridX = 6;
$gridY = 109;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "sandybeach_score";
$station = "STO";
$gridX = 10;
$gridY = 50;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "sand_city_score";
$station = "MTR";
$gridX = 98;
$gridY = 72;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "shoreline_score";
$station = "MTR";
$gridX = 97;
$gridY = 109;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "st_helena_score";
$station = "MTR";
$gridX = 89;
$gridY = 167;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "tollhouse_score";
$station = "HNX";
$gridX = 68;
$gridY = 109;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "vacaridge_score";
$station = "MTR";
$gridX = 104;
$gridY = 152;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "vallejo_score";
$station = "STO";
$gridX = 9;
$gridY = 51;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "waddel_score";
$station = "MTR";
$gridX = 87;
$gridY = 95;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "windy_score";
$station = "MTR";
$gridX = 90;
$gridY = 107;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "day_dreams_score";
$station = "REV";
$gridX = 35;
$gridY = 94;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "duck_hill_score";
$station = "REV";
$gridX = 44;
$gridY = 92;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "kingsbury_score";
$station = "REV";
$gridX = 38;
$gridY = 81;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "peavine_score";
$station = "REV";
$gridX = 40;
$gridY = 109;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "rainbow_east_score";
$station = "REV";
$gridX = 39;
$gridY = 114;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "rainbow_west_score";
$station = "REV";
$gridX = 39;
$gridY = 114;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "slide_score";
$station = "REV";
$gridX = 40;
$gridY = 96;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "owens_lee_score";
$station = "REV";
$gridX = 54;
$gridY = 32;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "shasta_score";
$station = "MFR";
$gridX = 116;
$gridY = 28;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "whaleback_score";
$station = "MFR";
$gridX = 119;
$gridY = 34;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "woodrat_score";
$station = "MFR";
$gridX = 97;
$gridY = 71;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lakeview_blackcap_score";
$station = "MFR";
$gridX = 186;
$gridY = 52;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lakeview_dohertyslide_score";
$station = "MFR";
$gridX = 213;
$gridY = 39;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lakeview_sugarhill_score";
$station = "MFR";
$gridX = 183;
$gridY = 35;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "lakeview_hadleybutte_score";
$station = "MFR";
$gridX = 179;
$gridY = 77;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "pine_score";
$station = "PDT";
$gridX = 45;
$gridY = 27;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "marshall_score";
$station = "SGX";
$gridX = 61;
$gridY = 79;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "pointnorth_score";
$station = "SLC";
$gridX = 98;
$gridY = 161;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "pointsouth_score";
$station = "SLC";
$gridX = 97;
$gridY = 161;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "parma_score";
$station = "LOX";
$gridX = 104;
$gridY = 72;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "more_mesa_score";
$station = "LOX";
$gridX = 101;
$gridY = 70;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "bates_score";
$station = "LOX";
$gridX = 112;
$gridY = 66;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "cayucos_score";
$station = "LOX";
$gridX = 71;
$gridY = 121;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "cuesta_score";
$station = "LOX";
$gridX = 78;
$gridY = 114;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "mdo_score";
$station = "LOX";
$gridX = 69;
$gridY = 116;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "laguna_score";
$station = "LOX";
$gridX = 76;
$gridY = 113;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);

$site_score = "owens_walts_score";
$station = "VEF";
$gridX = 18;
$gridY = 127;
getWind ($site_score, $station, $gridX, $gridY, $datetime_updating);
getLift ($site_score, $station, $gridX, $gridY, $datetime_updating);


/* this worked but not reliable ?
$ch = curl_init();  // create curl resource
$url_wind = "https://api.weather.gov/gridpoints/".$station."/".$gridX.",".$gridY."/forecast/hourly";
curl_setopt($ch, CURLOPT_URL, $url_wind);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //return the transfer as a string
curl_setopt($ch,CURLOPT_USERAGENT,'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13');
$json_wind_forecast = curl_exec($ch); // $output contains the output string
*/

/* did not work
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url_wind);
$result = curl_exec($ch);
curl_close($ch);
$obj = json_decode($result);
echo $obj;
*/

 /*  did not work
$json = file_get_contents($url_wind);
$obj = json_decode($json);
echo($obj);
*/



?>

