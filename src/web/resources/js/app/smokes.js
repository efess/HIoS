var $ = require('jquery'),
    R = require('ramda'),
    Promise = require('promise'),
    ajax = require('./ajax'),
    Chart = require('chart');

var chart = null;
var smokes = {
    hookupButton: function(){
        $('#clickme').on('click', function(){
            smokes.getEvents();  
        });
        $('#granularity').on('change', smokes.getEvents)
    }, 
    getEvents: function(){
        var granularity = $('#granularity').val();
        ajax.get('/eventstest', {
                deviceId: 'efbfbd0d-0d0f-efbf-bddd-8444efbfbd1a',
                from: '0',
                to: '3443881643',
                gran: granularity,
                limit: 30
            })
            .then(smokes.updateChart);
    },
    updateChart: function(dataset) {
        var formatDate = function(date){
             
            var month = (date.getMonth()+1).toString(),
            day = date.getDate().toString();
            var dateStr = [month.length === 2 ? month : "0" + month, day.length === 2 ? day : "0" + day].join('/');
              
            var hours = date.getHours() + 1;
            var minutes = date.getMinutes().toString();
            var suffix = 'AM';
            
            if(hours > 12) {
                hours = hours - 12;
                suffix = 'PM';   
            } 
            minutes = minutes.length === 2 ? minutes : '0' + minutes;
            
            return dateStr + ' ' + hours + ':' + minutes + ' ' + suffix;
        };chart
        dataset = R.reverse(dataset);
        var labels = R.map(function(ts) { 
                return formatDate(new Date(ts * 1000));
            }, R.pluck('timestamp', dataset));
        var chartOptions = {
            // Boolean - Whether to animate the chart
            animation: false,
            legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
        };
        var chartData = { 
            labels: labels,//String - A legend template
            datasets: [
                {
                    label: "Inside Temp",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: R.pluck('temp1', dataset)
                },
                {
                    label: "Outside Temp",
                    fillColor: "rgba(151,187,205,0.2)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: R.pluck('temp2', dataset)
                }
            ]
        };
        if(!chart) {
            var ctx = document.getElementById("temps").getContext("2d");
            chart = new Chart(ctx).Line(chartData, chartOptions);
        } else {
            chart.initialize(chartData);
        }
        
    }
}

$(document).ready(function(){
    smokes.hookupButton();
});

module.exports = smokes;