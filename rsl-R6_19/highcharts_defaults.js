
$(document).ready(function() {
	Highcharts.setOptions({
	    global: { useUTC: false },         /* display times in browser's local timezone, not UTC */
		chart : { backgroundColor: "white" },
		colors: [ "#014493", "#4E0197", "#A3007F", "#D10029", "#E15100", "#E18A00", "#E1B000", "#E1D400", "#A4D600", "#3FC200", "#00936A" ],
		title : { style: { fontFamily: "Arial", fontSize: "14pt", fontWeight: "bold", color: "#54075B" } },
		xAxis : { title: { style: { fontFamily: "Arial", fontSize: "10pt", fontWeight: "normal", color: "#666" } },
			labels: { style: { fontFamily: "Arial", fontSize: "9pt", fontWeight: "normal", color: "#666" } } },
		yAxis : { title: { style: { fontFamily: "Arial", fontSize: "10pt", fontWeight: "normal", color: "#666" } },
			labels: { style: { fontFamily: "Arial", fontSize: "9pt", fontWeight: "normal", color: "#666" } } },
		labels: { style: { fontFamily: "Arial", fontSize: "10pt", fontWeight: "normal", color: "#666" } },
		legend: { style: { fontFamily: "Arial", fontSize: "10pt", fontWeight: "normal", color: "#666" } }
	});
});