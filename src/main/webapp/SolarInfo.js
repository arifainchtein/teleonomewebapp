
class SolarInfo {
    constructor(latitude, longitude, altitude, minEffLed, minEffWifi) {
        // Constants
        this.STC_IRRADIANCE = 1000;  // Standard Test Condition irradiance (W/m2)
        this.STC_TEMPERATURE = 25;    // Standard Test Condition temperature (°C)
        this.PANEL_AREA = 1.6;        // Solar panel area in m2
        this.PANEL_PEAK_WATTS = 280;  // Panel peak power in watts
        this.TEMP_COEFFICIENT = -0.004; // Temperature coefficient
        this.TURBIDITY_FACTOR = 2.0;   // Atmospheric turbidity factor
        
        // Cloud factors
        this.CLEAR_SKY_FACTOR = 1.0;
        this.LIGHT_CLOUDS_FACTOR = 0.8;
        this.MEDIUM_CLOUDS_FACTOR = 0.6;
        this.HEAVY_CLOUDS_FACTOR = 0.3;
        this.OVERCAST_FACTOR = 0.1;

        // Instance variables
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude = altitude;
        this.weatherForecasts = [];
        this.weatherDataAvailable = false;
        this.isForecastValid = false;
        this.minEfficiencyLed = minEffLed;
        this.minEfficiencyWifi = minEffWifi;
    }

    calculateTimeFactors(hour, dayOfYear, latitude) {
        const declination = this.calculateSolarDeclination(dayOfYear);
        const elevation = this.calculateSolarElevation(hour, declination);
        
        let factors = {
            elevation: elevation,
            airMass: 0,
            scattering: 0,
            absorption: 0
        };

        if (elevation > 0) {
            factors.airMass = 1 / (Math.sin(elevation * Math.PI/180) + 
                            0.50572 * Math.pow((6.07995 + elevation), -1.6364));
        }

        factors.scattering = Math.exp(-0.1 * factors.airMass);
        factors.absorption = Math.exp(-0.2 * factors.airMass);

        return factors;
    }

    setWeatherForecast(forecasts) {
        this.weatherForecasts = [...forecasts];
        this.weatherDataAvailable = true;
    }

    getCloudFactor(cloudiness) {
        if (cloudiness <= 0) return this.CLEAR_SKY_FACTOR;
        else if (cloudiness <= 30) return this.LIGHT_CLOUDS_FACTOR;
        else if (cloudiness <= 70) return this.MEDIUM_CLOUDS_FACTOR;
        else if (cloudiness <= 90) return this.HEAVY_CLOUDS_FACTOR;
        else return this.OVERCAST_FACTOR;
    }

    calculateActualPower(year, month, date, hour, minute) {
        let data = {
            efficiency: 0,
            actualPower: 0,
            irradiance: 0,
            temperature: 0
        };
        
        const timeDecimal = hour + (minute / 60.0);
        const weather = this.getWeatherForHour(timeDecimal);
        const elevation = this.calculateSolarElevation(timeDecimal, 
                            this.calculateSolarDeclination(this.getDayOfYear(year, month, date)));

        if (elevation <= 0) return data;
        
        const baseIrradiance = this.STC_IRRADIANCE * Math.sin(elevation * Math.PI / 180);
        const transmission = this.calculateAtmosphericTransmission(elevation, weather);
        const actualIrradiance = baseIrradiance * transmission;
        const baseEfficiency = Math.cos((90 - elevation) * Math.PI / 180);
        const adjustedEfficiency = this.calculateTempAdjustedEfficiency(baseEfficiency, weather.temperature);
        
        const power = actualIrradiance * this.PANEL_AREA * adjustedEfficiency;
        
        data.efficiency = adjustedEfficiency;
        data.actualPower = Math.min(power, this.PANEL_PEAK_WATTS);
        data.irradiance = actualIrradiance;
        data.temperature = weather.temperature;
        
        return data;
    }

    calculateDailySolarPowerSchedule(year, month, date) {
        const schedules = [];
        
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const data = this.calculateActualPower(year, month, date, hour, minute);
                schedules.push({
                    time: new Date(year, month-1, date, hour, minute).getTime()/1000,
                    power: data.actualPower,
                    efficiency: data.efficiency
                });
            }
        }
        
        return schedules;
    }

    getDayOfYear(year, month, day) {
        const daysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let dayOfYear = daysInMonth[month - 1] + day;

        if (month > 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
            dayOfYear++;
        }
        return dayOfYear;
    }

    calculateSolarDeclination(dayOfYear) {
        return 23.45 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365.0);
    }

    calculateSolarElevation(hour, declination) {
        const hourAngle = (hour - 12) * 15;
        const sinElevation = Math.sin(this.latitude * Math.PI / 180) * Math.sin(declination * Math.PI / 180) +
                            Math.cos(this.latitude * Math.PI / 180) * Math.cos(declination * Math.PI / 180) *
                            Math.cos(hourAngle * Math.PI / 180);
        return Math.asin(sinElevation) * 180 / Math.PI;
    }

    calculateAtmosphericTransmission(elevation, weather) {
        if (elevation <= 0) return 0;

        const AM = 1 / (Math.sin(elevation * Math.PI / 180) + 
                    0.50572 * Math.pow((6.07995 + elevation), -1.6364));
        
        const pressure_correction = weather.pressure / 1013.25;
        let transmission = Math.pow(0.7, AM * pressure_correction);
        
        transmission *= (1.0 - (weather.humidity / 100.0) * 0.1);
        const cloud_factor = 1.0 - (weather.cloudiness / 100.0) * 0.75;
        transmission *= Math.exp(-this.TURBIDITY_FACTOR * AM / 100);
        transmission *= 1.0 + (this.altitude / 100000.0);

        return transmission * cloud_factor;
    }

    calculateTempAdjustedEfficiency(baseEfficiency, temperature) {
        const tempDiff = temperature - this.STC_TEMPERATURE;
        const tempEffect = 1.0 + (this.TEMP_COEFFICIENT * tempDiff);
        return baseEfficiency * tempEffect;
    }

    getWeatherForHour(hour) {
        // Simplified weather simulation
        return {
            temperature: 25 + Math.sin(hour * Math.PI / 12) * 5,
            cloudiness: Math.random() * 30,
            humidity: 50 + Math.random() * 20,
            pressure: 1013.25
        };
    }

    generateHTMLTable(year, month, date) {
        const schedules = this.calculateDailySolarPowerSchedule(year, month, date);
        
        let tableHTML = `
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th>Time</th>
                        <th>Efficiency (%)</th>
                        <th>Power (W)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        schedules.forEach(schedule => {
            const time = new Date(schedule.time * 1000);
            const efficiency = schedule.efficiency * 100; // Convert to percentage
            
            // Determine row class based on efficiency
            let rowClass = '';
            let status = 'Insufficient';
            if (efficiency >= this.minEfficiencyWifi) {
                rowClass = 'table-success';
                status = 'WiFi & LED Available';
            } else if (efficiency >= this.minEfficiencyLed) {
                rowClass = 'table-warning';
                status = 'LED Only';
            }

            tableHTML += `
                <tr class="${rowClass}">
                    <td>${time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td>${efficiency.toFixed(2)}%</td>
                    <td>${schedule.power.toFixed(2)}</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    }
}