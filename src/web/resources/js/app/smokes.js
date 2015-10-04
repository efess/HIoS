var $ = require('jquery'),
    R = require('ramda'),
    Chart = require('chart');

var smokes = {
    hookupButton: function(){
        $('#clickme').on('click', function(){
            smokes.getEvents();  
        });
    },
    getEvents: function(){
        $.ajax({
            url: '/eventstest',
            data: {
                deviceId: '43baf2c3-a2f9-4d51-91fa-dff703dc913c',
                from: '0',
                to: '3443881643',
                gran: 3600 // 5 minutes
            },
            success: smokes.updateChart,
            dataType: 'json'
        }) 
    },
    updateChart: function(dataset) {
        var formatDate = function(date){
             
            var month = (date.getMonth()+1).toString(),
            day = date.getDate().toString();
            var dateStr = [month.length === 2 ? month : "0" + month, day.length === 2 ? day : "0" + day].join('/');
            
            var hours = date.getHours() + 1;
            var minutes = date.getMinutes().toString();
            var suffix = 'AM';
            
            if(hours > 12){
                hours = hours - 12;
                suffix = 'PM';   
            }
            minutes = minutes.length === 2 ? minutes : '0' + minutes;
            
            return dateStr + ' ' + hours + ':' + minutes + ' ' + suffix;
        };
        var chartSetup = {
            labels: R.map(function(ts) {
                return formatDate(new Date(ts * 1000));
            }, R.pluck('timestamp', dataset)),
            datasets: [
                {
                    label: "My First dataset",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: R.pluck('temp1', dataset)
                },
                {
                    label: "My Second dataset",
                    fillColor: "rgba(151,187,205,0.2)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: R.pluck('temp2', dataset)
                }
            ]
        };
        
        var ctx = document.getElementById("temps").getContext("2d");
        var tempChart = new Chart(ctx).Line(chartSetup);
    }
}

$(document).ready(function(){
    smokes.hookupButton();
});

module.exports = smokes;