<?php

/*
*
*  Gets the json_lift in MySQL table, returns it as json to javascript
*
*/

// display errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// connect to the database
$mysqli = new mysqli("foo", "bar");
if ($mysqli -> connect_errno) {
  echo "Failed to connect to MySQL: " . $mysqli -> connect_error;
  exit();
}

// get variables from AJAX
$gridX = $_POST['gridX'];
$gridY = $_POST['gridY'];
$station = $_POST['station'];

// Perform query
if ($result = $mysqli -> query("SELECT * FROM weather_forecast WHERE gridX = '$gridX' AND gridY = '$gridY' LIMIT 1")) {
    while($row = mysqli_fetch_assoc($result)) {
        $json_lift = $row["json_lift"];
        echo $json_lift;  // this is returned to weatheralert.js
     }
}

// close connection to MySQL
$mysqli -> close();

?>
