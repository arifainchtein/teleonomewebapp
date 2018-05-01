function drawTimeSeriesMultiLineChart(id, fileName, units){

	var svg = d3.select(id),
	margin = {top: 30, right: 20, bottom: 30, left: 50},

	width = parseInt(d3.select("#"+id).style("width")) - margin.left - margin.right,
	height = parseInt(d3.select("#"+id).style("height")) - margin.top - margin.bottom,
	g = d3.select("#"+id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	if(height<170)height = 247 - margin.top - margin.bottom;
	
	
	// var margin = {top: 20, right: 55, bottom: 30, left: 40},
	// width  = 1000 - margin.left - margin.right,
	// height = 500  - margin.top  - margin.bottom;

	var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
	var y = d3.scale.linear().rangeRound([height, 0]);
	
	var line = d3.svg.line()
	.interpolate("cardinal")
	.x(function (d) { return x(d.label) + x.rangeBand() / 2; })
	.y(function (d) { return y(d.value); });
	
	
	var color = d3.scale.ordinal()
	.range(["#001c9c","#101b4d","#475003","#9c8305","#d3c47c"]);
	var svg = d3.select(id).append("svg")
	.attr("width",  width  + margin.left + margin.right)
	.attr("height", height + margin.top  + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	d3.csv(fileName, function (error, data) {
		console.log("Inital Data", data);
		var labelVar = 'TimestampMillis';
		var varNames = d3.keys(data[0])
		.filter(function (key) { return key !== labelVar;});
		color.domain(varNames);
		var seriesData = varNames.map(function (name) {
			return {
				name: name,
				values: data.map(function (d) {
					return {name: name, label: d[labelVar], value: +d[name]};
				})
			};
		});
		console.log("seriesData", seriesData);
		x.domain(data.map(function (d) { return d.quarter; }));
		y.domain([
			d3.min(seriesData, function (c) { 
				return d3.min(c.values, function (d) { return d.value; });
			}),
			d3.max(seriesData, function (c) { 
				return d3.max(c.values, function (d) { return d.value; });
			})
			]);
		var series = svg.selectAll(".series")
		.data(seriesData)
		.enter().append("g")
		.attr("class", "series");
		series.append("path")
		.attr("class", "line")
		.attr("d", function (d) { return line(d.values); })
		.style("stroke", function (d) { return color(d.name); })
		.style("stroke-width", "4px")
		.style("fill", "none");
	});
}

function drawTimeSeriesMultiLineChart2(id, fileName, units){
	var svg = d3.select(id),
	margin = {top: 30, right: 20, bottom: 30, left: 50},

	width = parseInt(d3.select("#"+id).style("width")) - margin.left - margin.right,
	height = parseInt(d3.select("#"+id).style("height")) - margin.top - margin.bottom,
	g = d3.select("#"+id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	var	x = d3.time.scale().range([0, width]);
	var	y = d3.scale.linear().range([height, 0]);

	var	xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(5);

	var	yAxis = d3.svg.axis().scale(y)
	.orient("left").ticks(5);

	var	valueline = d3.svg.line()
	.x(function(d,i) { return x(d.date); })
	.y(function(d,i) { 
		var keys = Object.keys(d);
		return y(d[keys[i]]); 
	});



	var	svg = d3.select("#"+id)
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//	Get the data
	d3.csv(fileName, function(error, data) {
		data.forEach(function(d) {
			d.date = new Date(d.TimestampMillis);
			var keys = Object.keys(d);
			//
			// start at 3 because timestampmillis and timestamp are always the first  2 column
			//
			for (var i = 2; i <= keys.length; i++) {
				console.log("key=" + keys[i]);
				d[c = keys[i]] = +d[c];
			}
		});

		// Scale the range of the data
		x.domain(d3.extent(data, function(d) { return d.date; }));
		y.domain([0, d3.max(data, function(d) { 
			var list = [];
			var keys = Object.keys(d);
			for (var i = 2; i <= keys.length; i++) {
				console.log("pushing =" + d[keys[i]]);
				list.push(d[keys[i]]);
			}
			return Math.max.apply(Math, list);
		}
		)]);

		for (var i = 0, len = data.length; i < len; i++) {
			var d = data[i];
			console.log("lline for =" + d);
			svg.append("path")		// Add the valueline path.
			.attr("class", "line")
			.attr("d", valueline(d,i));

		}



		svg.append("g")			// Add the X Axis
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

		svg.append("g")			// Add the Y Axis
		.attr("class", "y axis")
		.call(yAxis);

		var keys = Object.values(data);
		for (var i = 2; i <= keys.length; i++) {
			console.log("text for =" + d[keys[i]]);

			svg.append("text")
			.attr("transform", "translate(" + (width+3) + "," + y(data[keys[i]]) + ")")
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.style("fill", "red")
			.text(keys[i]);

		}


		for (var i = 2, len = data.length; i < len; i++) {
			var d = data[i];
			var keys = Object.keys(d);

			console.log("text for =" + d[keys[i]]);
			svg.append("text")
			.attr("transform", "translate(" + (width+3) + "," + y(data[keys[i]]) + ")")
			.attr("dy", ".35em")
			.attr("text-anchor", "start")
			.style("fill", "red")
			.text(keys[i]);

		}




	});
}

function type(d, _, columns) {
	d.date = new Date(d.TimestampMillis);
	for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
	return d;
}