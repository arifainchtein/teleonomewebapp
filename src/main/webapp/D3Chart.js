
function showTelepathonGraph(data, rangeMs) {
	// Set dimensions 
	//d3.select("#telepathon-graph").html("");
	// Get container width - using getBoundingClientRect() for better compatibility
    const graphContainer = document.getElementById('telepathon-graph');
    const containerWidth = graphContainer ? graphContainer.getBoundingClientRect().width : 300; // fallback width if element not found
    
    // Set dimensions with responsive values
    const margin = {top: 20, right: 10, bottom: 50, left: 10};
    const width = Math.max(containerWidth - margin.left - margin.right, 400); // ensure minimum width
    const height = Math.min(400, window.innerHeight * 0.5) - margin.top - margin.bottom;
  
	// Parse time
	const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
	data = data.map(d => {
		var raw = d.Value;
		var num;
		if (typeof raw === 'string' && raw.toLowerCase() === 'true') num = 1;
		else if (typeof raw === 'string' && raw.toLowerCase() === 'false') num = 0;
		else num = +raw;
		return { time: parseTime(d.timeString), value: num };
	});
  
	// Create SVG
	const svg = d3.select("#telepathon-graph")
	.append("svg")
	.attr("width", "100%")
	.attr("height", height + margin.top + margin.bottom)
	.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
	//.attr("preserveAspectRatio", "xMidYMid meet")
	.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`);

	// Set scales
	const x = d3.scaleTime()
	  .domain(d3.extent(data, d => d.time))
	  .range([0, width]);
  
	  // Filter outliers using 2nd-98th percentile so one bad value
	  // doesn't distort the Y axis scale for all the normal readings.
	  const sorted = data.map(d => d.value).slice().sort((a, b) => a - b);
	  const p2  = sorted[Math.max(0, Math.floor(sorted.length * 0.02))];
	  const p98 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.98))];
	  const plotData = data.filter(d => d.value >= p2 && d.value <= p98);
	  const safeData = plotData.length > 0 ? plotData : data;

	  const minValue = d3.min(safeData, d => d.value);
	  const maxValue = d3.max(safeData, d => d.value);
	  const padding = (maxValue - minValue) * 0.1 || Math.abs(maxValue) * 0.1 || 1;
	  const y = d3.scaleLinear()
		  .domain([minValue - padding, maxValue + padding])
		  .range([height, 0]);
	
  
	// Add line
	const line = d3.line()
	  .x(d => x(d.time))
	  .y(d => y(d.value));
  
	svg.append("path")
	  .datum(safeData)
	  .attr("fill", "none")
	  .attr("stroke", "steelblue")
	  .attr("stroke-width", 1.5)
	  .attr("d", line);
  
	 // Add axes with responsive formatting
	 // For multi-day ranges (e.g. the 7d button), hourly ticks all land on
	 // midnight and would all read "00:00" — show the date instead.
	 const axisTickFormat = rangeMs > 86400000 ? d3.timeFormat("%d %b") : d3.timeFormat("%H:%M");
	 const xAxis = svg.append("g")
	 .attr("transform", `translate(0,${height})`)
	 .call(d3.axisBottom(x)
		 .ticks(width < 600 ? 4 : 8) // Reduced number of ticks
		 .tickFormat(axisTickFormat));

 // Adjust x-axis labels for better mobile display
 xAxis.selectAll("text")
	 .style("text-anchor", "end")
	 .attr("dx", "-.8em")
	 .attr("dy", ".15em")
	 .attr("transform", "rotate(-45)");

 svg.append("g")
	 .call(d3.axisLeft(y)
		 .ticks(height < 400 ? 5 : 8));

 // Add dots with data display update
 svg.selectAll("circle")
	 .data(safeData)
	 .enter().append("circle")
	 .attr("r", 3)
	 .attr("cx", d => x(d.time))
	 .attr("cy", d => y(d.value))
	 .attr("fill", "steelblue")
	 .on("mouseover", function(event, d) {
		 const timeFormat = d3.timeFormat("%H:%M:%S");
		 d3.select("#dataDisplay")
			 .html(`Time: ${timeFormat(d.time)} | Value: ${d.value}`);
		 
		 d3.select(this)
			 .attr("r", 6)
			 .attr("fill", "red");
	 })
	 .on("mouseout", function() {
		 d3.select(this)
			 .attr("r", 3)
			 .attr("fill", "steelblue");
	 });

 // Style data display
 d3.select("#dataDisplay")
	 .style("font-family", "monospace")
	 .style("font-size", "14px");
}

  
function drawPieChart(id, data, title){

//	var pie_data = [{
//	"name": "Database",
//	"value": 7500,
//	"units":"MB",
//	"color":"#aa0055"
//	}, {
//	"name": "Other",
//	"value": 3000,
//	"units":"MB",
//	"color":"#2B60DE"
//	}, {
//	"name": "Empty",
//	"value": 6789,
//	"units":"MB",
//	"color":"#d0d0d0"
//	}];

	for(var i = 0; i < data.Value.length; i++) {
		var obj = data.Value[i];
		obj.Value = Number(obj.Value);
	}


	var screensize = document.documentElement.clientWidth;

	var pieHeight=200;
	var pieWidth=200;
	var legendHeight=0;
	var width = 500;

	if(screensize<500){
		legendHeight=data.Value.length*40;
		$("#"+id).height(pieHeight+legendHeight);
		// $("#"+id).width(400);
	}

	var pie_data = data.Value;
	height = pieHeight+legendHeight,
	radius = (Math.min(pieWidth, pieHeight) / 2);


	//var color = d3.scale.linear()
	//	  .domain([d3.min(pie_data, d=>d.value),
//	d3.mean(pie_data, d=>d.value),
//	d3.max(pie_data, d=>d.value)])
//	.range(["red", "yellow", "green"]);

	var arc = d3.arc()
	.outerRadius(radius - 10)
	.innerRadius(0);

	var pie = d3.pie()
	.sort(null)
	.value(function(d) {
		return d.Value;
	});

	var mySvg = d3.select("#"+id).append("svg")
	.attr("width", width+400)
	.attr("height", height)


	var svg = mySvg.append("g")
	.attr("transform", "translate(120 ,100)");

	var g = svg.selectAll(".arc")
	.data(pie(pie_data))
	.enter().append("g")
	.attr("class", "arc");

	g.append("path")
	.attr("d", arc)
	.style("stroke", "black")

	.style("fill", function(d) {
		//return color(d.data.value);
		return d3.rgb(d.data.Color);
	});



	g.append("text")
	.attr("text-anchor", "middle")
	.attr("transform", function(d) {
		return "translate(" + arc.centroid(d) + ")";
	})
	.attr("dy", ".35em")
	.style("font", "bold 18px sans-serif")
	.text(function(d) {
		return "";
	});


	var screensize = document.documentElement.clientWidth;

	var legendG = mySvg.selectAll(".legend") // note appending it to mySvg and not svg to make positioning easier
	.data(pie(pie_data))
	.enter().append("g")
	.attr("transform", function(d,i){
		//return "translate(" + i*230 + "," + (i * 1 + 450) + ")"; // place each legend on the right and bump each one down 15 pixels
		if(screensize<500){
			return "translate(" + (30) + "," + (pieHeight+10 + (i * 35)) + ")"; // place each legend on the right and bump each one down 15 pixels
		}else{
			return "translate(" + (pieWidth+30) + "," + (i * 35) + ")"; // place each legend on the right and bump each one down 15 pixels
		}
	})
	.attr("class", "legend");   

	legendG.append("rect") // make a matching color rect
	.attr("width", 20)
	.attr("height", 20)
	.attr("y",10)
	.attr("fill", function(d) {
		return d3.rgb(d.data.Color);
	});

	legendG.append("text") // add the text
	.text(function(d){
		return  d.data.Name + " ("+ d.data.Value +d.data.Units+")";
	})
	.style("font-size", 16)
	.attr("y", 30)
	.attr("x", 35);

//	legendG.append("text") // add the text
//	.text(function(d){
//	return "("+ d.data.Value +d.data.Units+")";
//	})
//	.style("font", "italic 14px sans-serif")
//	.attr("y", 65)
//	.attr("x",130);


	function type(d) {
		d.population = +d.population;
		return d;
	}

}


//The data variable has the following structure
//{
//"Series Type": "double",
//"Value": [
//,
//{
//"Value": 0,
//"Pulse Timestamp in Milliseconds": 1498806432506
//}
//],
//"Units": "AmpHr",
//"Name": "Maximum Current Charge For Range",
//"Value Type": "Time Series"
//}



function drawTimeSeriesLineChart(id, dataSource, graphTitle, timeScale){

	if(!d3.select("#"+id).hasOwnProperty("style")){
		console.log("could not find div " + id);
		//return;
	}
	if (arguments.length == 2) {
		graphTitle="";
		timeScale="%H:%M";
	}

	if (arguments.length == 3) {
		timeScale="%H:%M";
	}

//	Set the dimensions of the canvas / graph
	var	margin = {top: 30, right: 20, bottom: 30, left: 50},
//	width = 540 - margin.left - margin.right,
//	height = 247 - margin.top - margin.bottom;
	width = parseInt(d3.select("#"+id).style("width")) - margin.left - margin.right,
	height = parseInt(d3.select("#"+id).style("height")) - margin.top - margin.bottom;


//	// // // console.log("calculated height=" + height);
	if(height<170)height = 247 - margin.top - margin.bottom;
////	// // // console.log("starting drawtimeseries");
//	Parse the date / time
	var	parseDate = d3.timeParse(timeScale);

//	Set the ranges
	var	x = d3.scaleTime().range([0, width]);
	var	y = d3.scaleLinear().range([height, 0]);

//	Define the axes
	var	xAxis = d3.axisBottom(x).ticks(5);

	var	yAxis = d3.axisLeft(y).ticks(5);

//	Define the line
	var	valueline = d3.line()
	.x(function(d) { return x(d.date); })
	.y(function(d) { return y(d.close); });

	//Adds the svg canvas
	var	chart1 = d3.select("#"+id)
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");




	window.addEventListener('resize', chart1.render);


//	graphtitle

	chart1.append("text")
	.attr("x", (width / 2))             
	.attr("y", 0 - (margin.top / 2))
	.attr("text-anchor", "middle")  
	.style("font-size", "16px") 
	.style("text-decoration", "underline")  
	.text(graphTitle);


	chart1.append("text")
	.attr("class", "y label")
	.attr("text-anchor", "end")
	.attr("y", -15)
	.attr("dy", 0)
	.attr("x",15)
	.attr("transform", "rotate(0)")
	.style("font-size", "16px")
	.text(dataSource.Units);

	var data = dataSource.Value;
////	// // // console.log("dataSource=" + dataSource);

	data.forEach(function(d) {
		d.date = new Date(d["Pulse Timestamp in Milliseconds"]);
		d.close = +d.Value;
	});
	// d3's line generator connects points in array order, not x-position order -- see the
	// same fix/comment in drawDenomeMultiLineChart above for why this can't be assumed.
	data.sort(function(a, b) { return a.date - b.date; });

	var yDomainMin=dataSource.Minimum;

	if(yDomainMin == undefined){
		yDomainMin=0;
	}
	var yMax = d3.max(data, function(d) { return d.close; });

	// Scale the range of the data
	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain([yDomainMin, 1.1*yMax]);

	// Add the valueline path.
	chart1.append("path")
	.attr("class", "line")
	.attr("d", valueline(data));


	// Add the X Axis
	chart1.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

	// Add the Y Axis
	chart1.append("g")
	.attr("class", "y axis")
	.call(yAxis);

//	// // // console.log("finsished drawlineseries");
}
/*
 * Draws multiple time series lines on one shared chart. All series must share
 * the same units (matches how RenderingEngine.js's PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART
 * gathers every "Panel Data Source Pointer" DeneWord in a chart DeneChain into one array).
 *
 * dataSources: array of DeneWord-shaped objects, each like:
 *   {Name, Units, Minimum, Value: [{Value, "Pulse Timestamp in Milliseconds"}, ...]}
 * (i.e. exactly what getAllDeneWordsByIdentityPointer(..., COMPLETE) returns per pointer.)
 *
 * Named distinctly from drawTimeSeriesMultiLineChart (CSVMultiLineChart.js) on purpose -- that
 * pre-existing function already handles the (id, fileName, units) CSV call shape used by
 * PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART (e.g. "Charge and Load Last 24 Hrs Chart").
 * Reusing that name here would silently clobber whichever of the two script tags loads last,
 * which is exactly what broke both the CSV chart and this one when first tried. This function
 * is only ever called for the PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART (Denome-array) case --
 * see the RenderingEngine.js call site.
 */
function drawDenomeMultiLineChart(id, dataSources, graphTitle, timeScale){
	if (arguments.length < 3) graphTitle = "";
	if (arguments.length < 4) timeScale = "%H:%M";

	if (!Array.isArray(dataSources)) {
		console.warn("drawDenomeMultiLineChart: expected an array of DeneWords for id=" + id);
		return;
	}

	// Legend is a vertical stack below the chart (one row per series) rather than packed onto
	// one line -- with a fixed per-entry width, long labels or a narrow panel (this chart sits
	// in the same col-lg-6 half-width column as the single-line charts) could push the last
	// entry past the SVG's own boundary, which isn't clipped by default (SVG's default overflow
	// is visible) -- that's what was making the panel look wider than its neighbors and made
	// the entries overlap. Stacking guarantees every row fits within the chart's own width.
	var legendRowHeight = 24;
	var margin = {top: 30, right: 20, bottom: 40 + (dataSources.length * legendRowHeight), left: 60},
		width = parseInt(d3.select("#"+id).style("width")) - margin.left - margin.right,
		height = parseInt(d3.select("#"+id).style("height")) - margin.top - margin.bottom;
	// Fallback total SVG height (247) matches drawTimeSeriesLineChart's fallback so this panel
	// isn't taller than its single-line-chart siblings sitting in the same col-lg-6 row.
	if (isNaN(height) || height < 170) height = 247 - margin.top - margin.bottom;
	if (isNaN(width) || width < 200) width = 500 - margin.left - margin.right;

	var x = d3.scaleTime().range([0, width]);
	var y = d3.scaleLinear().range([height, 0]);
	var xAxis = d3.axisBottom(x).ticks(5);
	var yAxis = d3.axisLeft(y).ticks(5);
	var colors = d3.schemeTableau10;

	var chart1 = d3.select("#"+id)
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	chart1.append("text")
		.attr("x", width / 2)
		.attr("y", 0 - (margin.top / 2))
		.attr("text-anchor", "middle")
		.style("font-size", "18px")
		.style("text-decoration", "underline")
		.text(graphTitle);

	if (dataSources.length > 0 && dataSources[0].Units) {
		chart1.append("text")
			.attr("text-anchor", "end")
			.attr("y", -15)
			.attr("x", 15)
			.style("font-size", "16px")
			.text(dataSources[0].Units);
	}

	var series = dataSources.map(function(ds) {
		// Some pulses can land in the time series with a timestamp but no "Value" (e.g. the
		// source read failed just for that one cycle) -- skip those points rather than letting
		// +undefined become NaN and break the line's "d" attribute / the min/max calculations
		// below. The rest of that series' line still draws fine across the gap.
		var values = (ds.Value || [])
			.filter(function(d) { return d.Value !== undefined && d.Value !== null && !isNaN(+d.Value); })
			.map(function(d) {
				return { date: new Date(d["Pulse Timestamp in Milliseconds"]), close: +d.Value };
			})
			// d3's line generator connects points in array order, not x-position order --
			// it assumes the source array is already chronological. That assumption broke
			// on ChinampaMonitor's memory time series (a Mnemosyne write bug flipped the
			// array's ordering convention partway through its life, see
			// UpdateTimeSeriesCounterOperation.java, 2026-07-16), so the line zigzagged
			// forward and backward through time instead of reading left to right. Sort here
			// defensively so the chart is correct regardless of what order the denome array
			// happens to be in.
			.sort(function(a, b) { return a.date - b.date; });
		return { name: ds.Name, minimum: ds.Minimum, values: values };
	});

	var allValues = [];
	series.forEach(function(s) { allValues = allValues.concat(s.values); });
	if (allValues.length === 0) return;

	var yDomainMin = d3.min(series.map(function(s) { return s.minimum !== undefined ? s.minimum : d3.min(s.values, function(d){return d.close;}); }));
	if (yDomainMin === undefined) yDomainMin = 0;
	var yMax = d3.max(allValues, function(d) { return d.close; });

	x.domain(d3.extent(allValues, function(d) { return d.date; }));
	y.domain([yDomainMin, 1.1 * yMax]);

	var valueline = d3.line()
		.x(function(d) { return x(d.date); })
		.y(function(d) { return y(d.close); });

	series.forEach(function(s, i) {
		chart1.append("path")
			.datum(s.values)
			// .style(), not .attr() -- the app's global CSS has a bare `path { ... }` rule
			// (see drawHippocampusPieChart's comment above) that overrides SVG presentation
			// attributes, which is why every line was rendering in the same color despite each
			// getting a distinct value here.
			.style("fill", "none")
			.style("stroke", colors[i % colors.length])
			.style("stroke-width", "2.5px")
			.attr("d", valueline);
	});

	chart1.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.style("font-size", "13px");

	chart1.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.selectAll("text")
		.style("font-size", "13px");

	// Legend: one row per series, stacked vertically below the x-axis, each row using the
	// chart's full width -- guarantees it fits regardless of label length or panel width.
	var legend = chart1.append("g").attr("transform", "translate(0," + (height + 45) + ")");
	series.forEach(function(s, i) {
		var row = legend.append("g").attr("transform", "translate(0," + (i * legendRowHeight) + ")");
		row.append("rect").attr("width", 16).attr("height", 16).style("fill", colors[i % colors.length]);
		row.append("text").attr("x", 24).attr("y", 13).style("font-size", "15px").text(s.name);
	});
}

function drawStackedBarChart(id, dataSource, graphTitle, dateRange){
	if (arguments.length == 2) {
		graphTitle="";
	}
	var  baseH=1;
	var hh= parseInt(d3.select("#"+id).style("height"));
	if(!isNaN(hh)){
		baseH=hh;
	}

	var data = dataSource.Value;

	var data = [
		  { year: "2006", redDelicious: "10", mcintosh: "15"},
		  { year: "2007", redDelicious: "12", mcintosh: "18" },
		  { year: "2008", redDelicious: "05", mcintosh: "20" },
		  { year: "2009", redDelicious: "01", mcintosh: "15" }
		];
	
	var screensize = document.documentElement.clientWidth;
	var  barLabelFontSize="16px";
	if(screensize<500){
		width=350;
		barLabelFontSize="12px";
	}else{
		width=500;
	}
	
	var margin = {top: 30, right: 20, bottom: 50, left: 30};

	width = width - margin.left - margin.right,
	height = baseH - margin.top - margin.bottom;


	if(height<170)height = 247 - margin.top - margin.bottom;
//	if(width<490)width=560- margin.left-margin.right;

	var	parseDate = d3.time.format(dateRange).parse;
	
	var svg = d3.select("body")
	  .append("svg")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	/* Data in strings like it would be if imported from a csv */

	

	var parse = d3.time.format("%Y").parse;


	// Transpose the data into layers
	var dataset = d3.layout.stack()(["redDelicious", "mcintosh", "oranges", "pears"].map(function(fruit) {
	  return data.map(function(d) {
	    return {x: parse(d.year), y: +d[fruit]};
	  });
	}));


	// Set x, y and colors
	var x = d3.scale.ordinal()
	  .domain(dataset[0].map(function(d) { return d.x; }))
	  .rangeRoundBands([10, width-10], 0.02);

	var y = d3.scale.linear()
	  .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.y0 + d.y; });  })])
	  .range([height, 0]);

	var colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];


	// Define and draw axes
	var yAxis = d3.svg.axis()
	  .scale(y)
	  .orient("left")
	  .ticks(5)
	  .tickSize(-width, 0, 0)
	  .tickFormat( function(d) { return d } );

	var xAxis = d3.svg.axis()
	  .scale(x)
	  .orient("bottom")
	  .tickFormat(d3.time.format("%Y"));

	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis);

	svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis);


	// Create groups for each series, rects for each segment 
	var groups = svg.selectAll("g.cost")
	  .data(dataset)
	  .enter().append("g")
	  .attr("class", "cost")
	  .style("fill", function(d, i) { return colors[i]; });

	var rect = groups.selectAll("rect")
	  .data(function(d) { return d; })
	  .enter()
	  .append("rect")
	  .attr("x", function(d) { return x(d.x); })
	  .attr("y", function(d) { return y(d.y0 + d.y); })
	  .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
	  .attr("width", x.rangeBand())
	  .on("mouseover", function() { tooltip.style("display", null); })
	  .on("mouseout", function() { tooltip.style("display", "none"); })
	  .on("mousemove", function(d) {
	    var xPosition = d3.mouse(this)[0] - 15;
	    var yPosition = d3.mouse(this)[1] - 25;
	    tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
	    tooltip.select("text").text(d.y);
	  });


	// Draw legend
	var legend = svg.selectAll(".legend")
	  .data(colors)
	  .enter().append("g")
	  .attr("class", "legend")
	  .attr("transform", function(d, i) { return "translate(30," + i * 19 + ")"; });
	 
	legend.append("rect")
	  .attr("x", width - 18)
	  .attr("width", 18)
	  .attr("height", 18)
	  .style("fill", function(d, i) {return colors.slice().reverse()[i];});
	 
	legend.append("text")
	  .attr("x", width + 5)
	  .attr("y", 9)
	  .attr("dy", ".35em")
	  .style("text-anchor", "start")
	  .text(function(d, i) { 
	    switch (i) {
	      case 0: return "Anjou pears";
	      case 1: return "Naval oranges";
	      case 2: return "McIntosh apples";
	      case 3: return "Red Delicious apples";
	    }
	  });


	// Prep the tooltip bits, initial display is hidden
	var tooltip = svg.append("g")
	  .attr("class", "tooltip")
	  .style("display", "none");
	    
	tooltip.append("rect")
	  .attr("width", 30)
	  .attr("height", 20)
	  .attr("fill", "white")
	  .style("opacity", 0.5);

	tooltip.append("text")
	  .attr("x", 15)
	  .attr("dy", "1.2em")
	  .style("text-anchor", "middle")
	  .attr("font-size", "12px")
	  .attr("font-weight", "bold");
}

function drawTimeSeriesBartChart(id, dataSource, graphTitle, dateRange){

	if (arguments.length == 2) {
		graphTitle="";
	}
	var  baseH=1;
	var hh= parseInt(d3.select("#"+id).style("height"));
	if(!isNaN(hh)){
		baseH=hh;
	}

	var data = dataSource.Value;

	var screensize = document.documentElement.clientWidth;
	var  barLabelFontSize="16px";
	if(screensize<500){
		width=350;
		barLabelFontSize="12px";
	}else{
		width=500;
	}
//	Set the dimensions of the canvas / graph
	var	margin = {top: 30, right: 20, bottom: 50, left: 40},
	width = width - margin.left - margin.right,
	height = baseH - margin.top - margin.bottom;


	if(height<170)height = 247 - margin.top - margin.bottom;
//	if(width<490)width=560- margin.left-margin.right;
	var	parseDate = d3.timeParse(dateRange);


	var x = d3.scaleBand().range([0, width]).round(true).padding(.05);
	var y = d3.scaleLinear().range([height, 0]);



//	Define the axes
	var	xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat(dateRange));

	var	yAxis = d3.axisLeft(y).ticks(10);



//	Adds the svg canvas
	var	chart1 = d3.select("#"+id)
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");



	data.forEach(function(d) {
		d.date = new Date(d["Pulse Timestamp in Milliseconds"]);
		d.Value = +d.Value;
	});




	//var yDomainMin=dataSource.Minimum;
	x.domain(data.map(function(d) { return d.date; }));
	y.domain([0, d3.max(data, function(d) { return d.Value; })]);

//	Add the X Axis
	chart1.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis)
	.selectAll("text")
	.style("text-anchor", "end")
	.attr("dx", "-.8em")
	.attr("dy", "-.35em")
	.attr("transform", "rotate(-90)" )
	.style("font-size","14px");

//	Add the Y Axis
	chart1.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Value ($)");



//	graphtitle

//	chart1.append("text")
//	.attr("x", (width / 2))             
//	.attr("y", 0 - (margin.top / 2))
//	.attr("text-anchor", "middle")  
//	.style("font-size", "16px") 
//	.style("text-decoration", "underline")  
//	.text(graphTitle);


	chart1.append("text")
	.attr("class", "y label")
	.attr("text-anchor", "end")
	.attr("y", -15)
	.attr("dy", 0)
	.attr("x",15)
	.attr("transform", "rotate(0)")
	.style("font-size", "16px")
	.text(dataSource.Units);


	chart1 .selectAll("bar")
	.data(data)
	.enter().append("rect")
	.style("fill", "steelblue")
	.attr("x", function(d) { return x(d.date); })
	.attr("width", x.bandwidth())
//	.attr("width", Math.min(x.bandwidth()-2, 20))
	.attr("y", function(d) { return y(d.Value); })
	.attr("height", function(d) { return height - y(d.Value); });

	chart1.selectAll(".text")
	.data(data)
	.enter()
	.append("text")
	.attr("class","label")
	.attr("x", (function(d) { return x(d.date) + x.bandwidth()/4 ; }  ))
	.attr("y", function(d) { return y(d.Value) +10; })
	.attr("dy", ".75em")
	.style("font-size", barLabelFontSize)
	.style("fill", "white")
	.text(function(d) { return d.Value; });




	document.addEventListener("DOMContentLoaded", resize);
	d3.select(window).on('resize', resize); 

	function resize() {
		console.log('----resize function----');
		// update width
		width = parseInt(d3.select("#"+id).style('width'), 10);
		width = width - margin.left - margin.right;

		height = parseInt(d3.select("#"+id).style("height"));
		height = height - margin.top - margin.bottom;
		console.log('----resiz width----'+width);
		console.log('----resiz height----'+height);
		// resize the chart

		x.range([0, width]).round(true).padding(.03);
		y.range([height, 0]);

		yAxis.ticks(Math.max(height/50, 2));
		xAxis.ticks(Math.max(width/50, 2));

		d3.select(chart1.node().parentNode)
		.style('width', (width + margin.left + margin.right) + 'px');

		chart1.selectAll('.bar')
		.attr("x", function(d) { return x(d.date); })
		.attr("width", x.bandwidth());

		chart1.selectAll("text")
		// .attr("x", function(d) { return xScale(d.food); })
		.attr("x", (function(d) { return x(d.date    ) + x.bandwidth() / 2 ; }  ))
		.attr("y", function(d) { return yScale(d.Value) + 1; })
		.attr("width", Math.min(x.bandwidth()-2, 20))
		.attr("dy", ".75em");

		chart1.select('.x.axis').call(xAxis).selectAll("text").attr("y",10).call(wrap, x.bandwidth());
		// Swap the version below for the one above to disable rotating the titles
		// svgContainer.select('.x.axis').call(xAxis.orient('top')).selectAll("text").attr("x",55).attr("y",-25);


	}

}

// Pie chart using D3 v7. slices: [{name, value}]. colors: optional hex array.
// Uses .style() for fill/stroke so the global CSS `path { fill: none }` rule is overridden.
function drawHippocampusPieChart(containerId, slices, colors) {
	var container = document.getElementById(containerId);
	if (!container || !slices || slices.length === 0) return;
	d3.select('#' + containerId).selectAll('*').remove();

	colors = colors || d3.schemeTableau10;
	var total = slices.reduce(function(s, d) { return s + d.value; }, 0);
	if (total === 0) return;
	var w = Math.max(container.getBoundingClientRect().width || 240, 180);
	var h = 200;
	var r = Math.min(w * 0.38, h / 2 - 8);
	var legendX = r * 2 + 16;

	var pie = d3.pie().value(function(d) { return d.value; }).sort(null);
	var arc = d3.arc().outerRadius(r).innerRadius(0);

	var svg = d3.select('#' + containerId).append('svg')
		.attr('width', '100%')
		.attr('height', h);

	var g = svg.append('g')
		.attr('transform', 'translate(' + r + ',' + (h / 2) + ')');

	// Use .style() not .attr() — the global CSS `path { fill: none }` overrides SVG presentation attributes
	g.selectAll('.harc')
		.data(pie(slices))
		.enter().append('path')
		.attr('d', arc)
		.style('fill', function(d, i) { return colors[i % colors.length]; })
		.style('stroke', 'white')
		.style('stroke-width', '1px');

	var legend = svg.append('g').attr('transform', 'translate(' + legendX + ',12)');
	slices.forEach(function(s, i) {
		var y = i * 22;
		legend.append('rect').attr('x', 0).attr('y', y).attr('width', 13).attr('height', 13)
			.style('fill', colors[i % colors.length]);
		var count = s.value.toLocaleString();
		var label = s.name + ' (' + count + ')';
		if (label.length > 28) label = label.substring(0, 26) + '…';
		legend.append('text').attr('x', 17).attr('y', y + 11)
			.style('font-size', '11px').style('fill', '#333').style('stroke', 'none').text(label);
	});
}
