/*

Developer notes:

Gets NWS point forecasts, and calculates if paragliding conditions are good

The NWS API is used https://www.weather.gov/documentation/services-web-api
which gives wind speed and direction, and top of lift

Use Lat, Lon to get the Station and Grid X, Y
https://api.weather.gov/points/37.674,-122.495 (ex. Mussel Rock)

"forecastHourly" is in the response (used for Wind info)
https://api.weather.gov/gridpoints/MTR/84,122/forecast/hourly (ex. Mussel Rock)

 "forecastGridData" is in the response (used for Lift info)
https://api.weather.gov/gridpoints/MTR/106,127 (ex. Juniper)

A server is set up to run cronjob.php to update MySQL json from NWS API every hour

*/

/*
*
*  The function getWinddata gets wind data from stored in MySQL, checks wind conditions, colors boxes.
*  The NWS API is sometimes slow and unreliable, so that is why MySQL storage is used for the JSON data.
*
*/

// global variable therow is where colored day boxes will built
var therow = "";


// this function getBig is used to mark sites for good XC potential
function getBig(tagdate,site_score, gridX, gridY, station, big_height) {



    $.ajax({
        url     : "weatherlift.php",
        dataType: "json",
        method  : "POST",
        data    : {
            "gridX" : gridX,
            "gridY" : gridY,
            "station" : station
        },
        success: function (bigdata) {

            // $('#channing_score2020-07-31').css({"background-color":"blue"});

            var x = 0;
            var mixingheight_value = 0.0;
            var mixingheight_date = "";

            var site_name = site_score.slice(0, -6);

            dottime = 0;
            for (x = 0; x < bigdata.properties.mixingHeight.values.length; x++) {

                mixingheight_value = bigdata.properties.mixingHeight.values[x].value;
                validTime = bigdata.properties.mixingHeight.values[x].validTime;
                mixingheight_date = validTime.substring(0,10);

                if (mixingheight_date == tagdate && mixingheight_value > big_height) {
                    // a match, add xc dot
                    dottime++;
                    // console.log("site_score ="+site_score+", mixingheight_date="+mixingheight_date+", mixingheight_value="+mixingheight_value+", matchdate="+tagdate);
                    // console.log("dottime ="+dottime);

                    if (dottime == 1) {
                        $('#'+site_score+tagdate).append('<sup class="dot"></sup>');
                        // therow = therow.concat('<div class="dot"></div>');
                    }
                }
            }

        }, // end success
        error: function (error) {
                // console.log('*** error at getBig function: ' + error );
        }  // end error
    }); // end of ajax call


}


function getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height) {
    // console.log ("[2 "+site_score+"] getWinddata - query MySQL for " + station + " " + gridX + ", " + gridY);
    $.ajax({
        url     : "weatheralert.php",
        dataType: "json",
        method  : "POST",
        data    : {
            gridX : gridX,
            gridY : gridY,
            station : station,
            site_score : site_score
        },
        success : function(response){
            // response is the wind data in JSON format
            // console.log("[3 "+site_score+"] getWinddata success - got JSON data from weather_forecast MySQL table");

            // greeno and yellowo are used to add the number of hours in the
            // day where the wind is an acceptable strength and direction.
            var therow = "";
            var greeno = 0;
            var yellowo = 0;
            var timestr = "";
            var thehour = "";
            var isutc = "";
            var thespeed = 0;
            var speedmin_act = 0;
            var speedmax_act = 0;
            var speedmax_actarray = "";
            var thedirection = "";
            var site_score_dot = 0;

            // date information, determine what day of the week it is
            var d = new Date();
            var weekday = new Array(7);
            weekday[0] = "Su";
            weekday[1] = "Mo";
            weekday[2] = "Tu";
            weekday[3] = "We";
            weekday[4] = "Th";
            weekday[5] = "Fr";
            weekday[6] = "Sa";
            var todaynum = d.getDay();
            var todayhour = d.getHours();

            // there are 155 hourly entries in the JSON data
            // loop through each hourly entry and adds up conditions each day
            var i = 0;
            for (i = 0; i < 155; i++) {

                // get thehour for the data block
                timestr = response.properties.periods[i].startTime;  // 2020-07-27T16:00:00-07:00
                thehour = timestr.substring(11,13); // 16
                isutc = timestr.substring(20,22); //  07 for PT, 00 for UTC return
                if (isutc === "00") {
                    thehour = thehour - 7;
                    if (thehour < 0) {
                        thehour = thehour + 24;
                    }
                }

                // get the wind speed range
                thespeed = response.properties.periods[i].windSpeed;
                if (thespeed.length < 7) {
                    speedmin_act = thespeed.substring(0,thespeed.indexOf("mph"));
                    speedmax_act = thespeed.substring(0,thespeed.indexOf("mph"));
                } else {
                    speedmin_act = thespeed.substring(0,thespeed.indexOf("to"));
                    speedmax_actarray = thespeed.match("to(.*)mph");
                    speedmax_act = speedmax_actarray[1];
                }
                speedmin_act = parseInt(speedmin_act);
                speedmax_act = parseInt(speedmax_act);

                // get the wind direction
                thedirection = response.properties.periods[i].windDirection;

                // at 00 the day is completed, so add up for previous day and color the box ..
                if (thehour == "00") {

                    var tagtime = timestr = response.properties.periods[i-1].startTime;
                    var tagdate = tagtime.substring(0,10);

                    if (greeno >= 3) {
                        therow = therow.concat('<div class="go-green" id="'+site_score+tagdate+'">'+weekday[todaynum]+'</div>');
                    } else if (greeno==1 || greeno == 2) {
                        therow = therow.concat('<div class="go-greenyellow" id="'+site_score+tagdate+'">'+weekday[todaynum]+'</div>');
                    } else if (yellowo >= 3) {
                        therow = therow.concat('<div class="go-yellow" id="'+site_score+tagdate+'">'+weekday[todaynum]+'</div>');
                    } else {
                        therow = therow.concat('<div class="go-red">'+weekday[todaynum]+'</div>');
                    }

                    // check if top of lift is good
                    if (big_height > 0 && (greeno >= 1 || yellowo >= 2)) {
                        getBig(tagdate,site_score,gridX,gridY,station,big_height);
                    }

                    todaynum++;
                    if (todaynum == 7) { todaynum = 0; } // loop on Sunday

                    // reset green, yellow for next day period
                    greeno = 0;
                    yellowo = 0;

                // incrementing colors depending on the days conditions
                } else if (thehour >= hourstart && thehour <= hourend) {
                    if ((speedmin_act >= speedmin_ideal && speedmax_act <= speedmax_ideal) && (jQuery.inArray(thedirection, dir_ideal) !== -1)) {
                        console.log(site_score+" green: T="+thehour+"("+timestr+"), windspeed "+thespeed+", direction "+thedirection+", day "+weekday[todaynum]);
                        greeno = greeno+1;
                        yellowo = yellowo+1;
                    } else if ((speedmin_act >= speedmin_edge && speedmax_act <= speedmax_edge) && (jQuery.inArray(thedirection, dir_edge) !== -1)) {
                        console.log(site_score+" yellow: T="+thehour+"("+timestr+"), windspeed "+thespeed+", direction "+thedirection+", day "+weekday[todaynum]);
                        yellowo = yellowo + 1;
                    } else {
                        console.log(site_score+" red: T="+thehour+"("+timestr+"), windspeed "+thespeed+", direction "+thedirection+", day "+weekday[todaynum]);
                    }
                }

            } // end if for 155 for loop

            // site is done, examined all 155 hours, so append therow html divs
            $("#"+site_score).append(therow);

        }, // end success
        error: function(jqXHR, textStatus, errorThrown) {
           // console.log("error in main function getWinddata");
           // console.log(textStatus, errorThrown);
        }
    }); // end of ajax call

} // end of getWinddata function




/*
*  Temporary function to make sure lat, lng match the station, gridX, gridY
*  used manually once in a while to make sure NWS stations have not changed
*/
function checkGrid (site_score, lat, lng, station, gridX, gridY) {
    $.ajax({
        url: "https://api.weather.gov/points/"+lat+","+lng,
        dataType: "json",
        tryCount : 0,
        retryLimit : 3,
        headers: {
        "accept": "application/json"
        },
        success: function (response) {
            var real_station = response.properties.gridId;
            var real_gridX = response.properties.gridX;
            var real_gridY = response.properties.gridY;
            if (real_station != station) { alert("check for station error "+site_score);}
            if (real_gridX != gridX) { alert("check for gridX error "+site_score);}
            if (real_gridY != gridY) { alert("check for gridY error "+site_score);}
        },
        error : function(xhr, textStatus, errorThrown) {
            if (textStatus === "timeout" || textStatus === "error" ) {
                this.tryCount++;
                if (this.tryCount <= this.retryLimit) {
                    $.ajax(this);
                    return;
                }
            return;
            }
        }
    }); // end ajax POST
} // end of checkGrid function


$(document).ready(function() {

    // console.log("\n\n\nDocument ready \n");
    $("#thetitle").append( ", v2" );

    var timeStamp = Math.floor(Date.now() / 1000);
    // alert(timeStamp)

    // Temp button fill in fields
    $(".sitebox").click(function(e) {
        $(this).find(".nws_image").toggle("slow");
        $(this).find(".morestuff").toggle("slow");
            if ($(this).find(".plusexpand").text() === "+") {
                $(this).find(".plusexpand").text("-");
            }
            else {
                $(this).find(".plusexpand").text("+");
            }
    });

    var site_score = "";
    var station = "";
    var gridX = 0;
    var gridY = 0;
    var lat = 0;
    var lng = 0;
    var hourstart = 0;
    var hourend = 0;
    var speedmin_ideal = 0;
    var speedmax_ideal = 0;
    var speedmin_edge = 0;
    var speedmax_edge = 0;
    var dir_ideal = [];
    var dir_edge = [];
    var big_height = 0;
    var hourly_forecast = "";

    site_score = "big_sur_score";
    lat = 35.971;
    lng = -121.453;
    station = "MTR";
    gridX = 106;
    gridY = 40;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 2;
    speedmax_ideal = 8;
    speedmin_edge = 0;
    speedmax_edge = 11;
    big_height= 700;
    dir_ideal = ["SW", "WSW", "W"];
    dir_edge = ["SSW", "SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "berkeley_score";
    lat = 37.871;
    lng = -122.319;
    station = "MTR";
    gridX = 92;
    gridY = 130;
    hourstart = 11;
    hourend = 18;
    speedmin_ideal = 7;
    speedmax_ideal = 10;
    speedmin_edge = 6;
    speedmax_edge = 11;
    big_height = 0;
    dir_ideal = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    dir_edge = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "blue_rock_score";
    lat = 38.1384;
    lng = -122.1959;
    station = "STO";
    gridX = 12;
    gridY = 53;
    hourstart = 15;
    hourend = 19;
    speedmin_ideal = 8;
    speedmax_ideal = 11;
    speedmin_edge = 6;
    speedmax_edge = 14;
    big_height = 700;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "channing_score";
    lat = 38.098;
    lng = -122.180;
    station = "STO";
    gridX = 12;
    gridY = 51;
    hourstart = 12;
    hourend = 19;
    speedmin_ideal = 8;
    speedmax_ideal = 12;
    speedmin_edge = 6;
    speedmax_edge = 18;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "channing_east_score";
    lat = 38.099;
    lng = -122.180;
    station = "STO";
    gridX = 12;
    gridY = 51;
    hourstart = 10;
    hourend = 19;
    speedmin_ideal = 5;
    speedmax_ideal = 9;
    speedmin_edge = 3;
    speedmax_edge = 12;
    big_height = 0;
    dir_ideal = ["ENE", "E", "ESE"];
    dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "coloma_score";
    lat = 38.822;
    lng = -120.889;
    station = "STO";
    gridX = 63;
    gridY = 74;
    hourstart = 11;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 10;
    speedmin_edge = 0;
    speedmax_edge = 12;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["S","SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "davis_score";
    lat = 38.570;
    lng = -121.820;
    station = "STO";
    gridX = 29;
    gridY = 69;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 7;
    speedmax_ideal = 10;
    speedmin_edge = 6;
    speedmax_edge = 12;
    big_height = 0;
    dir_ideal = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    dir_edge = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "diablo_juniper_score";
    lat = 37.881;
    lng = -121.914;
    station = "MTR";
    gridX = 106;
    gridY = 127;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 8;
    speedmin_edge = 0;
    speedmax_edge = 14;
    big_height = 600;
    dir_ideal = ["SSW","SW", "WSW"];
    dir_edge = ["S", "SW", "WSW", "W"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "diablo_towers_score";
    lat = 37.881;
    lng = -121.914;
    station = "MTR";
    gridX = 106;
    gridY = 127;
    hourstart = 11;
    hourend = 18;
    speedmin_ideal = 3;
    speedmax_ideal = 8;
    speedmin_edge = 3;
    speedmax_edge = 11;
    big_height = 600;
    dir_ideal = ["WNW", "NW", "NNW"];
    dir_edge = ["W", "WNW", "W", "NW", "NNW", "N"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "drakes_score";
    lat = 38.0265;
    lng = -122.9634;
    station = "MTR";
    gridX = 71;
    gridY = 141;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 8;
    speedmax_ideal = 12;
    speedmin_edge = 7;
    speedmax_edge = 20;
    big_height = 0;
    dir_ideal = ["SE", "SSE"];
    dir_edge = ["ESE", "SE", "SSE", "S"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "dunlap_score";
    lat = 36.765;
    lng = -119.098;
    station = "HNX";
    gridX = 76;
    gridY = 96;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 7;
    speedmin_edge = 0;
    speedmax_edge = 11;
    big_height = 1000;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "ed_levin_score";
    lat = 37.475;
    lng = -121.861;
    station = "MTR";
    gridX = 104;
    gridY = 109;
    hourstart = 9;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 8;
    speedmin_edge = 0;
    speedmax_edge = 13;
    big_height = 700;
    dir_ideal = ["SSE", "S", "SSW", "SW", "WSW", "W", "WNW"];
    dir_edge = ["SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "elk_score";
    lat = 39.277;
    lng = -122.941;
    station = "EKA";
    gridX = 88;
    gridY = 30;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 6;
    speedmin_edge = 0;
    speedmax_edge = 9;
    big_height = 1000;
    dir_ideal = ["ESE","SE","SSE","NW", "WNW"];
    dir_edge = ["ESE", "SE", "SSE", "S", "SSW", "SW", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "goat_score";
    lat = 38.443;
    lng = -123.122;
    station = "MTR";
    gridX = 69;
    gridY = 161;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 9;
    speedmax_ideal = 13;
    speedmin_edge = 7;
    speedmax_edge = 18;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "grade_score";
    lat = 38.478;
    lng = -123.163;
    station = "MTR";
    gridX = 68;
    gridY = 163;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 9;
    speedmax_ideal = 12;
    speedmin_edge = 7;
    speedmax_edge = 16;
    big_height = 0;
    dir_ideal = ["SSW", "SW", "WSW"];
    dir_edge = ["SSE", "S", "SSW", "SW", "WSW", "W"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "hat_creek_score";
    lat = 40.842;
    lng = -121.428;
    station = "STO";
    gridX = 62;
    gridY = 167;
    hourstart = 15;
    hourend = 19;
    speedmin_ideal = 5;
    speedmax_ideal = 9;
    speedmin_edge = 3;
    speedmax_edge = 15;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "hull_score";
    lat = 39.509;
    lng = -122.937;
    station = "EKA";
    gridX = 91;
    gridY = 40;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 2;
    speedmax_ideal = 6;
    speedmin_edge = 0;
    speedmax_edge = 8;
    big_height = 1000;
    dir_ideal = ["SSW", "SW", "WSW"];
    dir_edge = ["S", "SSW", "SW", "WSW", "W"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "indianvalley_score";
    lat = 40.194;
    lng = -120.923;
    station = "REV";
    gridX = 12;
    gridY = 142;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 3;
    speedmax_ideal = 7;
    speedmin_edge = 0;
    speedmax_edge = 9;
    big_height = 1000;
    dir_ideal = ["SSW", "SW", "WSW"];
    dir_edge = ["S", "SSW", "SW", "WSW", "W"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "lagoonkite_score";
    lat = 38.333;
    lng = -122.002;
    station = "STO";
    gridX = 20;
    gridY = 60;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 7;
    speedmax_ideal = 11;
    speedmin_edge = 6;
    speedmax_edge = 13;
    big_height = 0;
    dir_ideal = ["S", "SSW","SW", "WSW", "W", "WNW","NW", "NNW"];
    dir_edge = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "lagoon_score";
    lat = 38.333;
    lng = -122.002;
    station = "STO";
    gridX = 20;
    gridY = 60;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 6;
    speedmax_ideal = 11;
    speedmin_edge = 5;
    speedmax_edge = 14;
    big_height = 0;
    dir_ideal = ["SW", "WSW", "W", "WNW"];
    dir_edge = ["SSW", "SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "musselrock_score";
    lat = 37.674;
    lng = -122.495;
    station = "MTR";
    gridX = 84;
    gridY = 122;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 11;
    speedmax_ideal = 17;
    speedmin_edge = 8;
    speedmax_edge = 22;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "mt_tam_score";
    lat = 37.911;
    lng = -122.625;
    station = "MTR";
    gridX = 82;
    gridY = 134;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 2;
    speedmax_ideal = 8;
    speedmin_edge = 0;
    speedmax_edge = 12;
    big_height = 700;
    dir_ideal = ["S", "SSW", "SW", "WSW", "W"];
    dir_edge = ["SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "mission_score";
    lat = 37.518;
    lng = -121.892;
    station = "MTR";
    gridX = 104;
    gridY = 111;
    hourstart = 9;
    hourend = 18;
    speedmin_ideal = 0;
    speedmax_ideal = 8;
    speedmin_edge = 0;
    speedmax_edge = 12;
    big_height = 700;
    dir_ideal = ["SW", "WSW", "W", "WNW", "NW"];
    dir_edge = ["SSW", "SW", "WSW", "W", "WNW", "NW", "N", "NNE"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "oroville_score";
    lat = 39.537;
    lng = -121.628;
    station = "STO";
    gridX = 44;
    gridY = 111;
    hourstart = 11;
    hourend = 18;
    speedmin_ideal = 7;
    speedmax_ideal = 10;
    speedmin_edge = 6;
    speedmax_edge = 12;
    big_height = 0;
    dir_ideal = ["N", "NNW"];
    dir_edge = ["N", "NNE", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "poplar_score";
    lat =  37.4554;
    lng = -122.4447;
    station = "MTR";
    gridX = 84;
    gridY = 112;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 8;
    speedmax_ideal = 13;
    speedmin_edge = 8;
    speedmax_edge = 18;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "potato_score";
    lat = 39.3317;
    lng = -122.685;
    station = "STO";
    gridX = 6;
    gridY = 109;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 2;
    speedmax_ideal = 7;
    speedmin_edge = 0;
    speedmax_edge = 10;
    big_height = 1000;
    dir_ideal = ["SE", "ESE", "ENE", "E"];
    dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "sandybeach_score";
    lat =  38.0772;
    lng = -122.2398;
    station = "STO";
    gridX = 10;
    gridY = 50;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 9;
    speedmax_ideal = 13;
    speedmin_edge = 7;
    speedmax_edge = 18;
    big_height = 0;
    dir_ideal = ["WSW", "W"];
    dir_edge = ["SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "sand_city_score";
    lat = 36.626;
    lng = -121.844;
    station = "MTR";
    gridX = 98;
    gridY = 72;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 10;
    speedmax_ideal = 14;
    speedmin_edge = 8;
    speedmax_edge = 20;
    big_height = 0;
    dir_ideal = ["WSW", "W","WNW"];
    dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "shoreline_score";
    lat = 37.430;
    lng = -122.076;
    station = "MTR";
    gridX = 97;
    gridY = 109;
    hourstart = 9;
    hourend = 19;
    speedmin_ideal = 7;
    speedmax_ideal = 11;
    speedmin_edge = 5;
    speedmax_edge = 13;
    big_height = 0;
    dir_ideal = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    dir_edge = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "st_helena_score";
    lat = 38.667;
    lng = -122.628;
    station = "MTR";
    gridX = 89;
    gridY = 167;
    hourstart = 11;
    hourend = 18;
    speedmin_ideal = 3;
    speedmax_ideal = 7;
    speedmin_edge = 0;
    speedmax_edge = 10;
    big_height = 700;
    dir_ideal = ["SW", "WSW"];
    dir_edge = ["S", "SSW", "SW", "WSW", "W"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "tollhouse_score";
    lat = 37.015;
    lng = -119.373;
    station = "HNX";
    gridX = 68;
    gridY = 109;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 3;
    speedmax_ideal = 7;
    speedmin_edge = 0;
    speedmax_edge = 10;
    big_height = 1000;
    dir_ideal = ["SW", "WSW", "W"];
    dir_edge = ["SSW", "SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "vacaridge_score";
    lat = 38.400;
    lng = -122.106;
    station = "MTR";
    gridX = 104;
    gridY = 152;
    hourstart = 11;
    hourend = 17;
    speedmin_ideal = 5;
    speedmax_ideal = 10;
    speedmin_edge = 0;
    speedmax_edge = 16;
    big_height = 600;
    dir_ideal = ["SW", "WSW", "W"];
    dir_edge = ["SSW", "SW", "WSW", "W", "WNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "vallejo_score";
    lat = 38.102;
    lng = -122.264;
    station = "STO";
    gridX = 9;
    gridY = 51;
    hourstart = 11;
    hourend = 19;
    speedmin_ideal = 7;
    speedmax_ideal = 11;
    speedmin_edge = 6;
    speedmax_edge = 14;
    big_height = 0;
    dir_ideal = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    dir_edge = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "waddel_score";
    lat = 37.089;
    lng = -122.274;
    station = "MTR";
    gridX = 87;
    gridY = 95;
    hourstart = 12;
    hourend = 18;
    speedmin_ideal = 7;
    speedmax_ideal = 9;
    speedmin_edge = 7;
    speedmax_edge = 12;
    big_height = 0;
    dir_ideal = ["WSW", "W", "WNW"];
    dir_edge = ["WSW", "W", "WNW", "NW"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    site_score = "windy_score";
    lat = 37.364;
    lng = -122.245;
    station = "MTR";
    gridX = 90;
    gridY = 107;
    hourstart = 10;
    hourend = 18;
    speedmin_ideal = 2;
    speedmax_ideal = 6;
    speedmin_edge = 0;
    speedmax_edge = 10;
    big_height = 0;
    dir_ideal = ["ENE", "E"];
    dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
    getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);


        // non-local areas

    $("#tahoe").one( "click", function() {
        $("#day_dreams").toggle("slow");
        $("#duck_hill").toggle("slow");
        $("#kingsbury").toggle("slow");
        $("#peavine").toggle("slow");
        $("#rainbow_east").toggle("slow");
        $("#rainbow_west").toggle("slow");
        $("#slide").toggle("slow");

        site_score = "day_dreams_score";
        lat = 39.242;
        lng = -120.008;
        station = "REV";
        gridX = 35;
        gridY = 94;
        hourstart = 12;
        hourend = 18;
        speedmin_ideal = 5;
        speedmax_ideal = 9;
        speedmin_edge = 5;
        speedmax_edge = 12;
        big_height = 0;
        dir_ideal = ["SSW", "SW", "WSW"];
        dir_edge = ["S", "SSW", "SW", "WSW", "W"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "duck_hill_score";
        lat = 39.241;
        lng = -119.741;
        station = "REV";
        gridX = 44;
        gridY = 92;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 2;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 12;
        big_height = 0;
        dir_ideal = ["SW","WSW", "W", "WNW", "NW"];
        dir_edge = ["WSW", "W", "WNW", "NW", "NNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "kingsbury_score";
        lat = 38.981;
        lng = -119.852;
        station = "REV";
        gridX = 38;
        gridY = 81;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 3;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 9;
        big_height = 0;
        dir_ideal = ["SSW", "SW", "WSW"];
        dir_edge = ["S", "SSW", "SW", "WSW", "W"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "peavine_score";
        lat = 39.590;
        lng = -119.929;
        station = "REV";
        gridX = 40;
        gridY = 109;
        hourstart = 11;
        hourend = 18;
        speedmin_ideal = 0;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 11;
        big_height = 0;
        dir_ideal = ["NNE", "NE", "ENE"];
        dir_edge = ["N", "NNE", "NE", "ENE", "E"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "rainbow_east_score";
        lat = 39.694;
        lng = -119.983;
        station = "REV";
        gridX = 39;
        gridY = 114;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 9;
        speedmax_ideal = 13;
        speedmin_edge = 7;
        speedmax_edge = 15;
        big_height = 0;
        dir_ideal = ["ENE", "E", "ESE"];
        dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "rainbow_west_score";
        lat = 39.694;
        lng = -119.983;
        station = "REV";
        gridX = 39;
        gridY = 114;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 9;
        speedmax_ideal = 13;
        speedmin_edge = 7;
        speedmax_edge = 18;
        big_height = 0;
        dir_ideal = ["WSW", "W","WNW"];
        dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "slide_score";
        lat = 39.319;
        lng = -119.867;
        station = "REV";
        gridX = 40;
        gridY = 96;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 2;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 10;
        big_height = 0;
        dir_ideal = ["ENE", "E", "ESE"];
        dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $("#owens").one( "click", function() {
        $("#owens_walts").toggle("slow");
        $("#owens_lee").toggle("slow");

        site_score = "owens_walts_score";
        lat =  36.4727;
        lng = -118.1150;
        station = "VEF";
        gridX = 18;
        gridY = 127;
        hourstart = 9;
        hourend = 13;
        speedmin_ideal = 0;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 12;
        big_height = 0;
        dir_ideal = ["ENE", "E", "ESE"];
        dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);


        site_score = "owens_lee_score";
        lat = 37.9763;
        lng = -119.1680;
        station = "REV";
        gridX = 54;
        gridY = 32;
        hourstart = 9;
        hourend = 13;
        speedmin_ideal = 0;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 8;
        big_height = 0;
        dir_ideal = ["E", "ENE"];
        dir_edge = ["NE", "ENE", "E", "ESE", "SE"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $("#oregon").one( "click", function() {
        $("#shasta").toggle("slow");
        $("#whaleback").toggle("slow");
        $("#woodrat").toggle("slow");
        $("#lakeview_blackcap").toggle("slow");
        $("#lakeview_dohertyslide").toggle("slow");
        $("#lakeview_sugarhill").toggle("slow");
        $("#lakeview_hadleybutte").toggle("slow");
        $("#pine").toggle("slow");

        site_score = "shasta_score";
        lat = 41.377;
        lng = -122.195;
        station = "MFR";
        gridX = 116;
        gridY = 28;
        hourstart = 7;
        hourend = 12;
        speedmin_ideal = 0;
        speedmax_ideal = 6;
        speedmin_edge = 0;
        speedmax_edge = 9;
        big_height = 0;
        dir_ideal = ["SSW", "SW", "WSW"];
        dir_edge = ["S", "SSW", "SW", "WSW", "W"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "whaleback_score";
        lat = 41.535;
        lng = -122.153;
        station = "MFR";
        gridX = 119;
        gridY = 34;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 0;
        speedmax_ideal = 8;
        speedmin_edge = 0;
        speedmax_edge = 11;
        big_height = 0;
        dir_ideal = ["WSW", "W", "WNW"];
        dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "woodrat_score";
        lat = 42.2313;
        lng = -123.0037;
        station = "MFR";
        gridX = 97;
        gridY = 71;
        hourstart = 11;
        hourend = 18;
        speedmin_ideal = 0;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 10;
        big_height = 0;
        dir_ideal = ["N", "W", "WNW", "NW", "NNW"];
        dir_edge = ["N", "NNE", "NE", "WSW", "W", "WNW", "NW", "NNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "lakeview_blackcap_score";
        lat = 42.204264;
        lng = -120.330122;
        station = "MFR";
        gridX = 186;
        gridY = 52;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 2;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 10;
        big_height = 0;
        dir_ideal = ["WSW", "W"];
        dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "lakeview_dohertyslide_score";
        lat = 42.019267;
        lng = -119.485666;
        station = "MFR";
        gridX = 213;
        gridY = 39;
        hourstart = 16;
        hourend = 19;
        speedmin_ideal = 4;
        speedmax_ideal = 7;
        speedmin_edge = 3;
        speedmax_edge = 10;
        big_height = 0;
        dir_ideal = ["WSW", "W", "WNW"];
        dir_edge = ["WSW", "W", "WNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "lakeview_sugarhill_score";
        lat = 41.806527;
        lng = -120.328704;
        station = "MFR";
        gridX = 183;
        gridY = 35;
        hourstart = 10;
        hourend = 19;
        speedmin_ideal = 2;
        speedmax_ideal = 7;
        speedmin_edge = 3;
        speedmax_edge = 8;
        big_height = 0;
        dir_ideal = ["WSW", "SW"];
        dir_edge = ["WSW", "W", "SW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "lakeview_hadleybutte_score";
        lat = 42.690833;
        lng = -120.666117;
        station = "MFR";
        gridX = 179;
        gridY = 77;
        hourstart = 10;
        hourend = 19;
        speedmin_ideal = 2;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 9;
        big_height = 0;
        dir_ideal = ["N", "NNE", "NNW"];
        dir_edge = ["N", "NNE", "NE", "NW", "NNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "pine_score";
        lat = 43.819367;
        lng = -120.932833;
        station = "PDT";
        gridX = 45;
        gridY = 27;
        hourstart = 10;
        hourend = 19;
        speedmin_ideal = 2;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 9;
        big_height = 0;
        dir_ideal = ["W", "WNW", "NW"];
        dir_edge = ["WSW", "W", "WNW", "NW", "NNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $("#losangeles").one( "click", function() {
        $("#marshall").toggle("slow");

        site_score = "marshall_score";
        lat = 34.2101;
        lng = -117.3028;
        station = "SGX";
        gridX = 61;
        gridY = 79;
        hourstart = 11;
        hourend = 18;
        speedmin_ideal = 9;
        speedmax_ideal = 14;
        speedmin_edge = 8;
        speedmax_edge = 20;
        big_height = 0;
        dir_ideal = ["S", "SSW", "SW", "WSW"];
        dir_edge = ["S", "SSW", "SW", "WSW", "W"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $("#santa_barbara").one( "click", function() {

        $("#parma").toggle("slow");
        $("#more_mesa").toggle("slow");
        $("#bates").toggle("slow");

        site_score = "parma_score";
        lat = 34.4827;
        lng = -119.7146;
        station = "LOX";
        gridX = 104;
        gridY = 72;
        hourstart = 10;
        hourend = 15;
        speedmin_ideal = 0;
        speedmax_ideal = 8;
        speedmin_edge = 0;
        speedmax_edge = 12;
        big_height = 0;
        dir_ideal = ["SSE", "S", "SSW", "SW"];
        dir_edge = ["ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "more_mesa_score";
        lat = 34.4197;
        lng = -119.7897;
        station = "LOX";
        gridX = 101;
        gridY = 70;
        hourstart = 10;
        hourend = 15;
        speedmin_ideal = 8;
        speedmax_ideal = 15;
        speedmin_edge = 7;
        speedmax_edge = 18;
        big_height = 0;
        dir_ideal = ["SSE", "S", "SSW", "SW"];
        dir_edge = ["SE", "SSE", "S", "SSW", "SW", "WSW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "bates_score";
        lat = 34.3820;
        lng = -119.4841;
        station = "LOX";
        gridX = 112;
        gridY = 66;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 8;
        speedmax_ideal = 12;
        speedmin_edge = 6;
        speedmax_edge = 20;
        big_height = 0;
        dir_ideal = ["SSW", "SW", "WSW"];
        dir_edge = ["S", "SSW", "SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $("#slo").one( "click", function() {

        $("#cayucos").toggle("slow");
        $("#cuesta").toggle("slow");
        $("#mdo").toggle("slow");
        $("#laguna").toggle("slow");

        site_score = "cayucos_score";
        lat = 35.4281;
        lng = -120.8729;
        station = "LOX";
        gridX = 71;
        gridY = 121;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 8;
        speedmax_ideal = 11;
        speedmin_edge = 6;
        speedmax_edge = 15;
        big_height = 0;
        dir_ideal = ["WSW", "W", "WNW"];
        dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "cuesta_score";
        lat = 35.2932;
        lng = -120.6449;
        station = "LOX";
        gridX = 78;
        gridY = 114;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 2;
        speedmax_ideal = 7;
        speedmin_edge = 0;
        speedmax_edge = 12;
        big_height = 0;
        dir_ideal = ["SW", "WSW", "W"];
        dir_edge = ["SSW", "SW", "WSW", "W", "WNW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "mdo_score";
        lat = 35.2932;
        lng = -120.8780;
        station = "LOX";
        gridX = 69;
        gridY = 116;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 7;
        speedmax_ideal = 12;
        speedmin_edge = 6;
        speedmax_edge = 20;
        big_height = 0;
        dir_ideal = ["W", "WNW", "NW"];
        dir_edge = ["WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

        site_score = "laguna_score";
        lat = 35.2691;
        lng = -120.6838;
        station = "LOX";
        gridX = 76;
        gridY = 113;
        hourstart = 10;
        hourend = 18;
        speedmin_ideal = 6;
        speedmax_ideal = 11;
        speedmin_edge = 5;
        speedmax_edge = 14;
        big_height = 0;
        dir_ideal = ["WSW", "W", "WNW"];
        dir_edge = ["SW", "WSW", "W", "WNW", "NW"];
        getWinddata(site_score, station, gridX, gridY, hourstart, hourend, speedmin_ideal, speedmax_ideal, speedmin_edge, speedmax_edge, dir_ideal, dir_edge, big_height);

    });

    $(".spinner img").remove();


}); // end document ready

