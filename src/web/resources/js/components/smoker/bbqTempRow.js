import React from 'react';
import $ from 'jquery';
import LabeledValue from './labeledValue';
import TempGraph from './tempGraph';
import ajax from '../../app/ajax';
import Paper from 'material-ui/Paper';
import SessionOptions from './sessionOptions';
import time from '../../app/helper/time';

export default class BbqTempRow extends React.Component {

    constructor(props){
        super(props);
    }

    static get defaultProps() {
        return {
            closeSession: function() {}
        }
    }

    handleTargetChange(value) {
        if(this.props.targetChange){
            this.props.targetChange(this.props.probeId, value);
        }
    }

    componentDidMount() {
    }

    graphData() {
        var data = this.props.history && this.props.history.data || []
        return  [
            data.map(function(d){ return { timestamp:d.timestamp* 1000, temp: d.temp }; })
        ]
    }
    currentTemp() {
        return this.props.current && 
            this.props.current.temp && 
            parseInt(this.props.current.temp)  || '---';
    }

    targetTemp() {
        return this.props.target && parseInt(this.props.target) || '---';
    }

    render() {
        var style = {
            header: {
                justifyContent: 'space-between',
                position: 'relative',
                display: 'flex'
            },
            probeContainer: {
                //backgroundColor: '#F3F3F3',
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
                color: '#CC3300',
                fontWeight: '700'
            },
            probeTargetTemp: {
                font: "tahoma",
                fontSize: '3rem',
                color: '#663300',
                fontWeight: '700'
            },
            timeSpent: {
                font: "tahoma",
                fontSize: '3rem',
                color: '#777777',
                fontWeight: '700'
            }
        }

        var sessionStart = this.props.start;
        var timeStr = "";
        if(sessionStart > 0) {
            timeStr = time.diffString(sessionStart, new Date().getTime());
        }

        var sessionOptions;
        if(this.props.probeId > 0) {
            sessionOptions = <SessionOptions 
                    onCloseSession={this.props.closeSession.bind(this)} 
                    probeId={this.props.probeId} 
                    tableId={this.props.tableId}/>;
        }

        return <Paper zDepth={1} rounded={false}>
            <div style={style.probeContainer} className="row">
                <div className="col-md-6 hidden-sm-down">
                    <TempGraph datasets={this.graphData()}/>
                </div>
                <div className="col-md-6 col-sm-12">
                    <div className="row">
                        <div className="col-sm-12" style={style.header}>
                            <div style={style.probeName}>{this.props.name}</div>
                            {sessionOptions}
                        </div>
                        <div className="col-sm-4 col-xs-6"><span style={style.probeCurrentTemp}>{this.currentTemp()}°</span></div>
                        <div className="col-sm-4 col-xs-6">
                            <LabeledValue color='#663300' size='3' value={this.targetTemp()} name="Target" change={this.handleTargetChange.bind(this)}/>
                        </div>
                        <div className="col-sm-4 col-xs-12" style={style.timeSpent}>{timeStr}</div>
                    </div>
                </div>
            </div>
        </Paper>;
    }
}