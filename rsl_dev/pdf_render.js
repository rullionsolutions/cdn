/*global require, system, console, phantom, setInterval */
"use strict";


var page = require('webpage').create(),
    system = require('system'),
    args = system.args, testindex = 0, loadInProgress = false,
    p = require('fs').absolute(require('system').args[0]);

console.log(p);
console.log(require('system').args[0]);
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

page.onLoadStarted = function() {
    loadInProgress = true;
    console.log("load started");
};

page.onLoadFinished = function() {
    loadInProgress = false;
    console.log("load finished");
};

page.paperSize = {
    format: 'A4',
    orientation: 'portraid',
    margin: '1cm',
    footer: {
        height: "0.7cm",
        contents: phantom.callback(function (pageNum, numPages) {
            return '<div style="text-align:center">' + pageNum + '</div>';
        })
    }
};

var steps = [
	function () {
		page.open(args[1]);
	},
	function () {
		var t = page.injectJs('../../../cdn/jquery-v1.7.2/jquery-1.7.2.min.js');
		t = t && page.injectJs('../../../cdn/highcharts-3.0.10/highcharts.js');
		t = t && page.injectJs('../../../cdn/highcharts-3.0.10/highcharts-more.js');
		t = t && page.injectJs('../../../cdn/highcharts-3.0.10/exporting.js');
        t = t && page.injectJs("../../../cdn/rsl_dev/render_charts.js");
//		console.log(t);
	},
	function () {
		page.evaluate(function(){ });
		page.render(args[2]);
    }
];

var interval = setInterval(function () {
  if (!loadInProgress && typeof steps[testindex] === "function") {
    console.log("step " + (testindex + 1));
    steps[testindex]();
    testindex += 1;
  }
  if (typeof steps[testindex] !== "function") {
    console.log("test complete!");
    phantom.exit();
  }
}, 500);
