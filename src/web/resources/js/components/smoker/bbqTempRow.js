import React from 'react';
import $ from 'jquery';
import LabeledValue from './labeledValue';
import TempGraph from './tempGraph';
import ajax from '../../app/ajax';

export default class BbqTempRow extends React.Component {

    constructor(props){
        super(props);
    }

    static get defaultProps() {
        return {
        }
    }

    handleTargetChange(e, value) {

    }

    componentDidMount() {
    }

    render() {
        var style = {
            probeContainer: {
                backgroundColor: '#F3F3F3',
                margin: '5px'
            },
            probeCurrentTemp: {
                font: "tahoma",
                fontSize: '4rem',
                color: '#FF9900',
                fontWeight: '700'
            },
            probeName: {
                font: "tahoma",
                fontSize: '3rem',
                color: '#777777',
                fontWeight: '700'
            },
            probeTargetTemp: {
                font: "tahoma",
                fontSize: '4rem',
                color: '#663300',
                fontWeight: '700'
            }
        }

        var currentTemp = this.props.current && this.props.current.temp || '---';
        var targetTemp = this.props.target || '---';
    
        return <div style={style.probeContainer} className="row">
            <div className="col-md-5 hidden-sm-down"><TempGraph data={this.props.history || []}/></div>
            <div className="col-md-3 col-xs-12 "><span style={style.probeName}>{this.props.name}</span></div>
            <div className="col-md-2 col-xs-6 "><span style={style.probeCurrentTemp}>{currentTemp}°</span></div>
            <div className="col-md-2 col-xs-6 "><LabeledValue color='#663300' size='4' value={targetTemp} name="Target" change={this.handleTargetChange.bind(this)}/></div>
        </div>;
    }
}