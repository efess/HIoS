var $ = require('jquery'),
    R = require('ramda'),
    Promise = require('promise'),
    ajax = require('./ajax'),
    Chart = require('chart.js'),
    //Chart = require('chart'),
    helper = require('./helper/chartHelper');

import ReactDOM from'react-dom';
import React from 'react'; 
import SmokerStatus from '../components/smoker/smokerStatus';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
 

var tempTypes = ['grill', 'meat'];
var deviceId = '31316536-6633-3939-2d64-6362372d3436';
var charts = {};
var smokes = {
    hookupButton: function(){
        $('#clickme').on('click', function(){
            smokes.getEvents();
        });
        
        $('#granularity').on('change', smokes.getEvents);
        
        tempTypes.forEach(function(tempType){
            var $block = $('.' + tempType + '-temp-block');
            var $value = $('.temp-target-value', $block);
            var $input = $('.temp-target-input', $block);
            $value.on('click', function() {
                $value.hide();
                $input.show();
                $input.focus();
            });
            function onsubmit() {
                var int = parseInt($input.val()) || 0;
                if(int > 50 && int < 1000) {
                    $value.text($input.val())
                    smokes.postTargetsUpdate();
                }
                onclose();
            }
            function onclose() {
                $input.val('');
                $value.show();
                $input.hide();
            }
        
            $input.on('blur', onsubmit);
            $input.keyup(function(e) {
                if (e.keyCode == 13) onsubmit();     // enter
                if (e.keyCode == 27) onclose();   // esc
            });
        });
    },
    getStatus: function(){ 
        var granularity = $('#granularity').val();
        ajax.get('/smokes/status', {
                deviceId: deviceId,
                from: '0',
                to: '3443881643',
                gran: granularity,
                limit: 30
            })
            .then(smokes.updateState);
    },
    startSession: function(){
        
    },
    postSessionUpdate: function(){
        
    },
    postTargetsUpdate: function(){
        var payload = {deviceId: deviceId};
        tempTypes.forEach(function(tempType){
            payload[tempType + 'Target'] = $('.' + tempType + '-temp-block .temp-target-value').text();
        });
        ajax.post('/smokes/changeTargets', payload);
    },
    updateState: function(payload){
        smokes.updateChart(payload.history);
        smokes.updateCurrent(payload.current || {}, payload.targets || {});
    },
    updateCurrent: function(current, targets){
        var fanLevels = ['Off', 'Low', 'Medium', 'High', 'Full'];
        $('.fan-state-value').text(fanLevels[current.fanstate] || '---');
        tempTypes.forEach(function(tempType){
            var temp = current[tempType + 'Temp'] || 0,
                target = targets[tempType + 'Target'] || 0,
                diff = target === 0 || temp === 0 ? 0 : Math.ceil(temp - target),
                diffStr = diff > 0 ? '+' + diff : diff || '---';
            
            $('.' + tempType + '-temp-block .temp-now-value').text(temp || '---');
            $('.' + tempType + '-temp-block .temp-target-value').text(target || '---');
            $('.' + tempType + '-temp-block .temp-diff-value').text(diffStr);   
        });
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
        };
        var granularity = $('#granularity').val();
        var formatTimeLabel = function(granularity) {
            var now = new Date();
            function fract(val){
                var frac = val % 1;
                if(frac >= .7) {
                    return ".75"
                }
                if(frac >= .5) {
                    return ".5"
                }
                if(frac >= .2) {
                    return ".25"
                }
                return "";
            }
            return function(date){
                var difference = now - date;
                var seconds = Math.ceil(difference / 1000);
                var minutes = seconds / 60;
                var hours = minutes / 60;
                
                if(Math.floor(hours) > 0) {
                    return Math.floor(hours) + fract(hours) + " hrs ago";
                }
                if(Math.floor(minutes) > 0) {
                    return Math.floor(minutes) + fract(hours) + " ms ago";
                }
                else return seconds + " s ago";
            }            
        };
        var counter = -1;
        dataset = R.reverse(dataset);
        var formatter = formatTimeLabel(granularity);
        var labels = R.map(function(ts) {
            //return formatDate(new Date(ts * 1000));
            // every 3rd 
            counter++;
            if(counter % 3 === 0){
                return formatter(new Date(ts*1000));
            } else {
                return '';
            } 
        }, R.pluck('timestamp', dataset));
        var scale = helper.calculateYScale(R.pluck('meatTemp', dataset),250);
        var chartOptions = {
            // Boolean - Whether to animate the chart
            animation: false,
            legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
            responsive: true,
            maintainAspectRatio: true,
            pointDot: false,
            scaleLabel: " <%=value%>",
            scaleShowVerticalLines: false,
            scaleBeginAtZero: false
        }; 
        var chartDataset = {
            'grill': {
                labels: labels,
                label: "Smoker",
                fillColor: "rgba(160,160,160,0.2)",
                strokeColor: "rgba(160,160,160,1)",
                pointColor: "rgba(160,160,160,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(160,160,160,1)",
                data: R.pluck('grillTemp', dataset)
            },
            'meat': {
                labels: labels,
                label: "Meat",
                fillColor: "rgba(178,141,91,0.2)",
                pointColor: "rgba(178,141,91,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(178,141,91,1)",
                data: R.pluck('meatTemp', dataset)
            }
        };
        tempTypes.forEach(function(tempType){
            var chartData = {
                datasets: [chartDataset[tempType]],
                labels: labels
            };
            if(!charts[tempType]) {
                var ctx = document.getElementById(tempType + "History").getContext("2d");
                var chart = new Chart(ctx, {type: 'line',data: chartData, options:chartOptions});
                
                charts[tempType] = chart;
            } else {
                //charts[tempType].initialize(chartData);
                charts[tempType].data.datasets = chartData.datasets;
                charts[tempType].data.labels = chartData.labels;
                charts[tempType].update();
            }
        });
    }
}

$(document).ready(function(){
    //smokes.hookupButton();
    //for debugging
    // setTimeout(function(){
    //     location.reload(true);
    // }, 2000)
    // smokes.getStatus();
  
  
    // for running:  
    // (function refresh(){
    //     smokes.getStatus();
    //     setTimeout(function(){
    //         refresh();
    //     }, 1003)
    // }());

    var domElement = document.getElementById('smoker-status');
    if(domElement) {
        ReactDOM.render(
            <MuiThemeProvider muiTheme={getMuiTheme()}>
                <SmokerStatus/>
                
            </MuiThemeProvider>
            ,
            domElement
        );
    }    
});

module.exports = smokes;