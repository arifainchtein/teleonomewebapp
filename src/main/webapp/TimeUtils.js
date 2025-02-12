function analyzeTransmissionIntervals(data) {
    // Sort data by timeSeconds
    const sortedData = data.sort((a, b) => parseInt(a.timeSeconds) - parseInt(b.timeSeconds));
    
    // Initialize hourly data structure
    const hourlyIntervals = {};
    for (let i = 0; i < 24; i++) {
        hourlyIntervals[i] = {
            intervals: [], // Store all intervals for this hour
            count: 0,
            average: 0,
            stdDev: 0,
            min: Infinity,
            max: -Infinity
        };
    }
    
    // Calculate intervals and group by hour
    for (let i = 1; i < sortedData.length; i++) {
        const currentTime = parseInt(sortedData[i].timeSeconds);
        const previousTime = parseInt(sortedData[i-1].timeSeconds);
        const interval = currentTime - previousTime;
        
        // Use the hour of the current transmission
        const hour = new Date(currentTime * 1000).getHours();
        
        hourlyIntervals[hour].intervals.push(interval);
        hourlyIntervals[hour].count++;
        hourlyIntervals[hour].min = Math.min(hourlyIntervals[hour].min, interval);
        hourlyIntervals[hour].max = Math.max(hourlyIntervals[hour].max, interval);
    }
    
    // Calculate statistics for each hour
    for (let hour = 0; hour < 24; hour++) {
        if (hourlyIntervals[hour].count > 0) {
            // Calculate average
            const sum = hourlyIntervals[hour].intervals.reduce((a, b) => a + b, 0);
            hourlyIntervals[hour].average = sum / hourlyIntervals[hour].count;
            
            // Calculate standard deviation
            if (hourlyIntervals[hour].count > 1) {
                const mean = hourlyIntervals[hour].average;
                const squareDiffs = hourlyIntervals[hour].intervals.map(interval => {
                    const diff = interval - mean;
                    return diff * diff;
                });
                const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / 
                                    (hourlyIntervals[hour].count - 1);
                hourlyIntervals[hour].stdDev = Math.sqrt(avgSquareDiff);
            }
        }
    }
    
    return hourlyIntervals;
}

// Helper function to format time in seconds to minutes:seconds
function formatTimeInterval(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}


function analyzeTimeSeriesData(data) {
    // Sort data by timeSeconds
    const sortedData = data.sort((a, b) => parseInt(a.timeSeconds) - parseInt(b.timeSeconds));
    
    // Calculate average interval
    let totalInterval = 0;
    let intervalCount = 0;
    
    for (let i = 1; i < sortedData.length; i++) {
        const interval = parseInt(sortedData[i].timeSeconds) - parseInt(sortedData[i-1].timeSeconds);
        totalInterval += interval;
        intervalCount++;
    }
    
    const averageInterval = totalInterval / intervalCount;
    
    // Calculate hourly statistics
    const hourlyData = {};
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = {
            values: [], // Store all values for calculating std dev
            sum: 0,
            count: 0,
            average: 0,
            stdDev: 0,
            min: Infinity,
            max: -Infinity
        };
    }
    
    // Group data by hour
    sortedData.forEach(item => {
        const date = new Date(parseInt(item.timeSeconds) * 1000);
        const hour = date.getHours();
        const value = parseFloat(item.Value);
        
        hourlyData[hour].values.push(value);
        hourlyData[hour].sum += value;
        hourlyData[hour].count++;
        hourlyData[hour].min = Math.min(hourlyData[hour].min, value);
        hourlyData[hour].max = Math.max(hourlyData[hour].max, value);
    });
    
    // Calculate averages and standard deviation for each hour
    for (let hour = 0; hour < 24; hour++) {
        if (hourlyData[hour].count > 0) {
            hourlyData[hour].average = hourlyData[hour].sum / hourlyData[hour].count;
            
            // Calculate standard deviation
            if (hourlyData[hour].count > 1) {
                const mean = hourlyData[hour].average;
                const squareDiffs = hourlyData[hour].values.map(value => {
                    const diff = value - mean;
                    return diff * diff;
                });
                const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / 
                                    (hourlyData[hour].count - 1);
                hourlyData[hour].stdDev = Math.sqrt(avgSquareDiff);
            }
            
            // Clean up values array to save memory
            delete hourlyData[hour].values;
        }
    }
    
    return {
        averageIntervalSeconds: averageInterval,
        averageIntervalMinutes: averageInterval / 60,
        averageIntervalHours: averageInterval / 3600,
        hourlyAverages: hourlyData
    };
}
