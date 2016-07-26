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
            height: 100,
            margin: { left: -1, top: 10, bottom: 0, right: 1 }
        }
    }

    handleResize(e) {
        let elem = ReactDOM.findDOMNode(this);
        let width = elem.offsetWidth;
        let height = elem.offsetHeight;

        this.setState({
            parentWidth: width,
            parentHeight: height
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
        var data = this.props && this.props.data || [];

        var pwidth = this.state.parentWidth || this.props.width;
        var pheight = this.state.parentHeight || this.props.height;

        var aSvg = new ReactFauxDOM.Element('svg');
        aSvg.setAttribute('width', '100%');
        aSvg.setAttribute('height', '100%');

        var svg = d3.select(aSvg),
            margin = {top: 5, right: 5, bottom: 5, left: 5},
            width = pwidth - margin.left - margin.right,
            height = pheight - margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleLinear().range([0, width]),
            y = d3.scaleLinear().range([height, 0]);

        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) {  return x(d.time);  })
            .y(function(d) {   return y(d.temp);  });

        x.domain(d3.extent(data, function(d) { return d.time; }));
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
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("ºF");
        
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        return (
            <div>{aSvg.toReact()}</div>
        );
    }
}