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
    
    // Calculate hourly averages
    const hourlyData = {};
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = {
            sum: 0,
            count: 0,
            average: 0
        };
    }
    
    // Group data by hour
    sortedData.forEach(item => {
        const date = new Date(parseInt(item.timeSeconds) * 1000);
        const hour = date.getHours();
        hourlyData[hour].sum += parseFloat(item.Value);
        hourlyData[hour].count++;
    });
    
    // Calculate averages for each hour
    for (let hour = 0; hour < 24; hour++) {
        if (hourlyData[hour].count > 0) {
            hourlyData[hour].average = hourlyData[hour].sum / hourlyData[hour].count;
        }
    }
    
    return {
        averageIntervalSeconds: averageInterval,
        averageIntervalMinutes: averageInterval / 60,
        averageIntervalHours: averageInterval / 3600,
        hourlyAverages: hourlyData
    };
}
