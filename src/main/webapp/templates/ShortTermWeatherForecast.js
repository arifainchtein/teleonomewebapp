class ShortTermWeatherForecast{

    constructor(){

    }

    process(title, sourceDataPointer){
        
        var panelHTML = "<div class=\"col-lg-6\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+title+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";

       
        
        //console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
        var renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
        //console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
        
        var deneWordMap = getDeneWordMapByDeneWordName(renderedDataSourceDene);
        var shortTermTime, shortTermTemp,shortTermHumidity,shortTermdescription,shortTermCloudiness;
        var shortTermRain,shortTermWindSpeed, shortTermWindDirection;
        
        
        for(var k2=1;k2<9;k2++){
            //
            // get all the values for each term 
            
            shortTermTime = deneWordMap.get("Short Term Forecast Period " + k2 +" TimeZoneTimestamp")["Value"];
            shortTermTemp = Math.ceil(deneWordMap.get("Short Term Forecast Period " + k2 +" Temperature")["Value"]);
            shortTermHumidity = deneWordMap.get("Short Term Forecast Period " + k2 +" Humidity")["Value"];
            shortTermdescription = deneWordMap.get("Short Term Forecast Period " + k2 +" Description")["Value"].split(" ");
            shortTermCloudiness = deneWordMap.get("Short Term Forecast Period " + k2 +" Cloudiness")["Value"];
            shortTermRain = deneWordMap.get("Short Term Forecast Period " + k2 +" Rain")["Value"];
            shortTermWindSpeed = deneWordMap.get("Short Term Forecast Period " + k2 +" Wind Speed")["Value"];
            shortTermWindDirection = deneWordMap.get("Short Term Forecast Period " + k2 +" Wind Direction")["Value"];
            
            
            panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm6 col-xs-6\">";
            panelHTML += "<div class=\"panel panel-default\">";
            panelHTML += "<div class=\"panel-heading\"><h6>"+shortTermTime+"</h6></div>";
            panelHTML += "<div class=\"panel-body text-center\">";
            panelHTML += "<h3>"+shortTermTemp +"&deg;C</h3><br><h4>"+shortTermdescription[0] +"<br>"+ shortTermdescription[1] +"</h4>";
            
            panelHTML += "</div>";
            panelHTML += "<div class=\"panel-footer\">";
            panelHTML += "<h5>Rain:"+ shortTermRain +"mm<br> Humidity:"+ shortTermHumidity+"%<br>Cloudiness:"+ shortTermCloudiness +"%<br>Wind:"+ shortTermWindSpeed +"m/s "+ shortTermWindDirection +" &deg;</h5>";
            panelHTML += "</div>";
            panelHTML += "</div>";// closing <div class="panel panel-default">
            panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
        }
        panelHTML += "</div>";
       
        rowPanelCounter+=1;
        return panelHTML;
    }
}