import React from 'react';
//import Tabs from 'material-ui/Tabs';
//import Tab from 'material-ui/Tabs/Tab';
//import TextField from 'material-ui/TextField';
//import ajax from '../app/ajax';
import $ from 'jquery';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';


export default class BbqTempRow extends React.Component {

    render() {
        var aSvg = new ReactFauxDOM.Element('svg');
        aSvg.setAttribute('width', 500);
        aSvg.setAttribute('height', 50);
        
        var data = (this.props || {}).data || {};
        var history = data.graph || [];

        var style = {
            probeContainer: {
                backgroundColor: '#F3F3F3',
                margin: '5px'
            },
            probeCurrentTemp: {
                font: "tahoma",
                fontSize: '3rem',
                color: '#FF9900',
                fontWeight: '700'
            },
            probeName: {
                font: "tahoma",
                fontSize: '3rem',
                color: '#777777',
                fontWeight: '700'
            }
        }

        var svg = d3.select(aSvg),
            margin = {top: 5, right: 5, bottom: 5, left: 5},
            width = svg.attr("width") - margin.left - margin.right,
            height = svg.attr("height") - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear().range([0, width]),
            y = d3.scaleLinear().range([height, 0]);

        var line = d3.line()
            //.curve(d3.curveBasis)
            .x(function(d) { 
                return x(d.time); 
            })
            .y(function(d) { 
                return y(d.temp); 
            });

        x.domain(d3.extent(history, function(d) { return d.time; }));
        y.domain([0, 400]);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Temperature, ºF");
        
        svg.append("path")
            .datum(history)
            .attr("class", "line")
            .attr("d", line);
        

        return  <div style={style.probeContainer} className="row">
            <div className="col-md-8 visible-md-block visible-lg-block">{aSvg.toReact()}</div>
            <div className="col-md-2"><span style={style.probeName}>{data.name}</span></div>
            <div className="col-md-2"><span style={style.probeCurrentTemp}>{data.current}°</span></div>
        </div>;
    }
}