function drawPieChart(id, data){

//	var pie_data = [{
//		"name": "Database",
//		"value": 7500,
//		"units":"MB",
//		"color":"#aa0055"
//	  }, {
//		"name": "Other",
//		"value": 3000,
//		"units":"MB",
//		"color":"#2B60DE"
//	  }, {
//		"name": "Empty",
//		"value": 6789,
//		"units":"MB",
//		"color":"#d0d0d0"
//	  }];
//
	for(var i = 0; i < data.Value.length; i++) {
	    var obj = data.Value[i];
	    obj.Value = Number(obj.Value);
	}
	
		var pie_data = data.Value;
	  var width = 300,
		height = 240,
		radius = (Math.min(width, height) / 2);
	  
	  
	  //var color = d3.scale.linear()
	//	  .domain([d3.min(pie_data, d=>d.value),
//		  d3.mean(pie_data, d=>d.value),
//		  d3.max(pie_data, d=>d.value)])
//		  .range(["red", "yellow", "green"]);

	  var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);
	  
		var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
		  return d.Value;
		});
	  
		var mySvg = d3.select("#"+id).append("svg")
		.attr("width", width+300)
		.attr("height", height)
		

	  var svg = mySvg.append("g")
		.attr("transform", "translate(" + ((width / 2)-50) + "," + ((height / 2)) + ")");
	  
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
	  

		var legendG = mySvg.selectAll(".legend") // note appending it to mySvg and not svg to make positioning easier
  .data(pie(pie_data))
  .enter().append("g")
  
  .attr("transform", function(d,i){
	//return "translate(" + i*230 + "," + (i * 1 + 450) + ")"; // place each legend on the right and bump each one down 15 pixels
	return "translate(" + (width -50) + "," + (i * 65 + 10) + ")"; // place each legend on the right and bump each one down 15 pixels
 })
 .attr("class", "legend");   

legendG.append("rect") // make a matching color rect
  .attr("width", 30)
  .attr("height", 30)
  .attr("y",40)
  .attr("fill", function(d) {
    return d3.rgb(d.data.Color);
  });

legendG.append("text") // add the text
  .text(function(d){
    return  d.data.Name + " ("+ d.data.Value +d.data.Units+")";
  })
  .style("font-size", 16)
  .attr("y", 65)
  .attr("x", 35);

//  legendG.append("text") // add the text
//  .text(function(d){
//    return "("+ d.data.Value +d.data.Units+")";
//  })
//  .style("font", "italic 14px sans-serif")
//  .attr("y", 65)
//  .attr("x",130);


	  function type(d) {
		d.population = +d.population;
		return d;
	  }

	}

//
// The data variable has the following structure
// {
//	"Series Type": "double",
//	"Value": [
//	    ,
//	    {
//	        "Value": 0,
//	        "Pulse Timestamp in Milliseconds": 1498806432506
//	    }
//	],
//	"Units": "AmpHr",
//	"Name": "Maximum Current Charge For Range",
//	"Value Type": "Time Series"
//}


	
function drawTimeSeriesLineChart(id, dataSource, graphTitle){
	
		  if (arguments.length == 2) {
			  graphTitle="";
		  }

	
// Set the dimensions of the canvas / graph
var	margin = {top: 30, right: 20, bottom: 30, left: 50},
//	width = 540 - margin.left - margin.right,
//	height = 247 - margin.top - margin.bottom;
width = parseInt(d3.select("#"+id).style("width")) - margin.left - margin.right,
height = parseInt(d3.select("#"+id).style("height")) - margin.top - margin.bottom;


// // // // console.log("calculated height=" + height);
if(height<170)height = 247 - margin.top - margin.bottom;
//// // // // console.log("starting drawtimeseries");
// Parse the date / time
var	parseDate = d3.time.format("%H:%M").parse;

// Set the ranges
var	x = d3.time.scale().range([0, width]);
var	y = d3.scale.linear().range([height, 0]);

// Define the axes
var	xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(5);

var	yAxis = d3.svg.axis().scale(y)
	.orient("left").ticks(5);

// Define the line
var	valueline = d3.svg.line()
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

//
// graphtitle
//
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
//// // // // console.log("dataSource=" + dataSource);

	data.forEach(function(d) {
		d.date = new Date(d["Pulse Timestamp in Milliseconds"]);
       d.close = +d.Value;
	});

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

// // // // console.log("finsished drawlineseries");
}




