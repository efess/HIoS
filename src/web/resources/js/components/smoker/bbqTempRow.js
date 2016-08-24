import React from 'react';
import $ from 'jquery';
import LabeledValue from './labeledValue';
import TempGraph from './tempGraph';
import ajax from '../../app/ajax';
import Paper from 'material-ui/Paper';
import SessionOptions from './sessionOptions';

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
        return ajax.post('smokes/updateProbeTarget', {
                probeId: this.props.probeId,
                deviceId: '31316536-6633-3939-2d64-6362372d3436',
                target: value
            })
            .then(this.loadSessions, function _fail(err) {
                console.log('failed updating target: ' + err);
            });
    }

    componentDidMount() {
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

        var time = this.props.start;
        var timeStr = "";
        if(time > 0) {
            var timeDiffSeconds = ((new Date().getTime() - time)/1000);
            var timeMinutes = parseInt(timeDiffSeconds / 60) % 60;
            var timeHours = parseInt(timeDiffSeconds / 3600) % 60;
            timeStr = "" + timeHours + ':' + ("0"+timeMinutes).slice(-2);
        }
        
        var currentTemp = this.props.current && 
            this.props.current.temp && 
            parseInt(this.props.current.temp)  || '---';

        var targetTemp = this.props.target && parseInt(this.props.target) || '---';
    
        // Normal look.
        // return <div style={style.probeContainer} className="row">
        //     <div className="col-lg-5 hidden-md-down"><TempGraph data={this.props.history || []}/></div>
        //     <div className="col-lg-3 col-md-6 col-sm-12"><span style={style.probeName}>{this.props.name}</span></div>
        //     <div className="col-lg-2 col-md-3 col-sm-6 "><span style={style.probeCurrentTemp}>{currentTemp}°</span></div>
        //     <div className="col-lg-2 col-md-3 col-sm-6"><LabeledValue color='#663300' size='4' value={targetTemp} name="Target" change={this.handleTargetChange.bind(this)}/></div>
        // </div>;

        var sessionOptions;
        if(this.props.probeId > 0) {
            sessionOptions = <SessionOptions onCloseSession={this.props.closeSession.bind(this)} probeId={this.props.probeId}/>;
        }
        return <Paper zDepth={1} rounded={false}>
            <div style={style.probeContainer} className="row">
                <div className="col-md-6 hidden-sm-down">
                    <TempGraph history={this.props.history || []}/>
                </div>
                <div className="col-md-6 col-sm-12">
                    <div className="row">
                        <div className="col-sm-12" style={style.header}>
                            <div style={style.probeName}>{this.props.name}</div>
                            {sessionOptions}
                        </div>
                        <div className="col-sm-4" style={style.timeSpent}>{timeStr}</div>
                        <div className="col-sm-4"><span style={style.probeCurrentTemp}>{currentTemp}°</span></div>
                        <div className="col-sm-4"><LabeledValue color='#663300' size='3' value={targetTemp} name="Target" change={this.handleTargetChange.bind(this)}/></div>
                    </div>
                </div>
            </div>
        </Paper>;
    }
}