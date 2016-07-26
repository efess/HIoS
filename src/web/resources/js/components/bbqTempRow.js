import React from 'react';
import $ from 'jquery';
import LabeledValue from './labeledValue';
import TempGraph from './tempGraph';

export default class BbqTempRow extends React.Component {

    static get defaultProps() {
        return {
        	data: {}
        }
    }
    render() {
        
        var data = this.props.data;
        var history = data.graph || [];

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

        return <div style={style.probeContainer} className="row">
            <div className="col-md-5 hidden-sm-down"><TempGraph data={history}/></div>
            <div className="col-md-3 col-xs-12 "><span style={style.probeName}>{data.name}</span></div>
            <div className="col-md-2 col-xs-6 "><span style={style.probeCurrentTemp}>{data.current}°</span></div>
            <div className="col-md-2 col-xs-6 "><LabeledValue color='#663300' size='4' value={data.target} name="Target" change={this.props.targetChange}/></div>
        </div>;
    }
}