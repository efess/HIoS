import React from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import ReactDOM from'react-dom';

export default class TempGraph extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            parentWidth: 0
        };
    }

    get mixins() { return [React.addons.PureRenderMixin]; }

    // static getInitialState() {
    //     return {
    //         parentWidth: 0
    //     }
    // }

    static get defaultProps() {
        return {
            width: 400,
            height: 150
        }
    }

    generateData(granularity) {
        var time = new Date().getTime() / 1000 - (granularity * 100);
        return Array.apply(null, {length: 100}).map(function(_, i) {
            var timestamp = time + (i * granularity);
            return {
                temp: Math.sin(timestamp / Math.PI) * 30 + 240,
                timestamp: timestamp
            };
        });
    }

    handleResize(e) {
        let elem = ReactDOM.findDOMNode(this);
        let width = elem.offsetWidth;

        this.setState({
            parentWidth: width
        });
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize.bind(this));
        
        this.handleResize();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    formatTimeLabel(granularity) {
        var now = new Date();
        function fract(val){
            var frac = val % 1;
            if(frac >= 0.7) {
                return ".75";
            }
            if(frac >= 0.5) {
                return ".5";
            }
            if(frac >= 0.2) {
                return ".25";
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
                return Math.floor(minutes) + fract(hours) + " min ago";
            }
            else return seconds + " s ago";
        }            
    }

    granularity() {
        return parseInt(this.props && this.props.history && this.props.history.gran || 0);
    }
    datasets() {
        return this.props && this.props.datasets  || [[]];
    }

    timeExtentMax() {
        return this.datasets().reduce(function(v, dataset){
            return dataset.reduce(function(v2, obj){
                return Math.max(v2, obj.timestamp);
            }, v);
        }, -Infinity);
    }

    timeExtentMin() {
        return this.datasets().reduce(function(v, dataset){
            return dataset.reduce(function(v2, obj){
                return Math.min(v2, obj.timestamp);
            }, v);
        }, Infinity);
    }

    render() {
        var component = this;
        var datasets = this.datasets();
        var granularity = this.granularity();
        var data = datasets[0];
        
        // data = data.map(function(d) {
        //     return {
        //         timestamp: d.timestamp * 1000,
        //         temp: d.temp
        //     };
        // });

        // data = this.generateData(granularity);
        var yValues = [];
        for(var i = 0; i <= 350; i+= 50) {
            yValues.push(i);
        }

        var pwidth = this.state.parentWidth || this.props.width;
        var pheight = this.props.height;
 
        var container = new ReactFauxDOM.Element('div');
        container.style.setProperty('position', 'relative');
 
        var aSvg = new ReactFauxDOM.Element('svg');
        aSvg.style.setProperty('position', 'relative');
        aSvg.setAttribute('width', '100%');
        aSvg.setAttribute('height', pheight + 'px');
 
        var svg = d3.select(aSvg),
            margin = {top: 5, right: 5, bottom: 20, left: 35},
            width = pwidth - margin.left - margin.right,
            height = pheight - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
        var x = d3.scaleLinear().range([0, width]),
            y = d3.scaleLinear().range([height, 0]);
        
        var line = d3.line()
            .curve(d3.curveMonotoneX)
            .x(function(d) {  return x(d.timestamp);  })
            .y(function(d) {  return y(d.temp);  });
 
        x.domain(d3.extent(data, function(d) { return d.timestamp; }));
        y.domain([0, 350]);
            
        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x)
                .ticks(width / 60)
                .tickFormat(d3.timeFormat("%-I:%M:%S")));

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y).tickValues(yValues))
            .append("text")
            .attr("x", 15)
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("ºF");
        
        datasets.forEach(function(dataset) {
            svg.append("path")
                .datum(dataset)
                .attr("class", "line")
                .attr("transform", "translate(" + margin.left + ",0)")
                .attr("d", line);
        });
 
        if(this.state.tip && this.state.tip.on) {
            var tooltip = new ReactFauxDOM.Element('div');
            tooltip.setAttribute('class', 'tempGraphTooltip');
            tooltip.style.setProperty('position', 'absolute');
            tooltip.style.setProperty('opacity','0');
 
            container.appendChild(tooltip);
 
            var tip = d3.select(tooltip)
                .attr('class', 'tempGraphTooltip')
                .style('opacity', '.9');
 
            tip.html(this.state.tip.val)
                    .style("left", (this.state.tip.x) + "px")                 
                    .style("top", (this.state.tip.y - 28) + "px");       
        }
 
        svg.selectAll("dot")
            .data(datasets[0]).enter()
            .append("circle")
            .style('fill', 'none')
            .style('stroke', 'none')
            .style('pointer-events', 'all')
            .attr("r", 5)
            .attr("cx", function(d) { return x(d.timestamp); })
            .attr("cy", function(d) { return y(d.temp); })
            .on("mouseover", function(d) {
                var tip = {
                    on: true,
                    x: d3.event.offsetX,
                    y: d3.event.offsetY,
                    val: d.temp
                }
                component.setState({tip: tip})
            })                                                                
            .on("mouseout", function(d) {      
                var tip = {
                    on: false
                }
                component.setState({tip: tip})
            });
 
        container.appendChild(aSvg);
        return (
            <div>{container.toReact()}</div>
        );
    }
}