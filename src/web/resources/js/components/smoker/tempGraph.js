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
            height: 100
        }
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

    render() {
        var component = this;
        var data = this.props && this.props.data || [];
 
        var pwidth = this.state.parentWidth || this.props.width;
        var pheight = this.props.height;
 
        var container = new ReactFauxDOM.Element('div');
 
        var aSvg = new ReactFauxDOM.Element('svg');
        aSvg.style.setProperty('position', 'relative');
        aSvg.setAttribute('width', '100%');
        aSvg.setAttribute('height', pheight + 'px');
 
        var svg = d3.select(aSvg),
            margin = {top: 5, right: 5, bottom: 15, left: 5},
            width = pwidth - margin.left - margin.right,
            height = pheight - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
 
        var x = d3.scaleLinear().range([0, width]),
            y = d3.scaleLinear().range([height, 0]);
 
        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) {  return x(d.timestamp);  })
            .y(function(d) {  return y(d.temp);  });
 
        x.domain(d3.extent(data, function(d) { return d.timestamp; }));
        y.domain([0, 400]);
 
        g.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
 
        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            //.attr("y", 6)
            //.attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("ºF");
       
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);
 
        if(this.state.tip && this.state.tip.on) {
            var tooltip = new ReactFauxDOM.Element('div');
            tooltip.setAttribute('class', 'tempGraphTooltip');
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
            .data(data).enter()
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