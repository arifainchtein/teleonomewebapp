class DailyWeatherForecast{

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
        var dailyTermTime, dailyTermMinTemp, dailyTermMaxTemp,dailyTermHumidity,dailyTermdescription,dailyTermCloudiness;
        var dailyTermRain,dailyTermWindSpeed, dailyTermWindDirection;
        
        
        for(var k2=1;k2<5;k2++){
            //
            // get all the values for each term 
            
            dailyTermTime = deneWordMap.get("Daily Forecast Day " + k2 +" TimeZoneTimestamp")["Value"];
            dailyTermMaxTemp = Math.ceil(deneWordMap.get("Daily Forecast Day " + k2 +" Maximum Temperature")["Value"]);
            dailyTermMinTemp = Math.ceil(deneWordMap.get("Daily Forecast Day " + k2 +" Minimum Temperature")["Value"]);
            dailyTermHumidity = deneWordMap.get("Daily Forecast Day " + k2 +" Humidity")["Value"];
            dailyTermdescription = deneWordMap.get("Daily Forecast Day " + k2 +" Description")["Value"].split(" ");
            
            dailyTermCloudiness = deneWordMap.get("Daily Forecast Day " + k2 +" Cloudiness")["Value"];
            dailyTermRain = deneWordMap.get("Daily Forecast Day " + k2 +" Rain")["Value"];
            dailyTermWindSpeed = deneWordMap.get("Daily Forecast Day " + k2 +" Wind Speed")["Value"];
            dailyTermWindDirection = deneWordMap.get("Daily Forecast Day " + k2 +" Wind Direction")["Value"];
            
            
            panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm6 col-xs-6\">";
            panelHTML += "<div class=\"panel panel-default\">";
            panelHTML += "<div class=\"panel-heading\"><h6>"+dailyTermTime+"</h6></div>";
            panelHTML += "<div class=\"panel-body text-center\">";
            panelHTML += "<h4>"+dailyTermMinTemp +"&deg;C - "+dailyTermMaxTemp +"&deg;C<br>"+dailyTermdescription[0]+"<br>"+ dailyTermdescription[1] +"</h4>";
            
            panelHTML += "</div>";
            panelHTML += "<div class=\"panel-footer\">";
            panelHTML += "<h5>Rain:"+ dailyTermRain +"mm<br> Humidity:"+ dailyTermHumidity+"%<br>Cloudiness:"+ dailyTermCloudiness +"%<br>Wind:"+ dailyTermWindSpeed +"m/s "+ dailyTermWindDirection +" &deg;</h5>";
            panelHTML += "</div>";
            panelHTML += "</div>";// closing <div class="panel panel-default">
            panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
        }
        panelHTML += "</div>";    
       rowPanelCounter+=1;
        return panelHTML;
    }
}