import React from 'react';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import LineChart from './lineChart';
import ajax from '../../app/ajax';
import $ from 'jquery';
import TimerMixin from 'react-timer-mixin';
import Paper from 'material-ui/Paper';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const granularityOptions = [
  <MenuItem key={1} value={10} primaryText="Ten Seconds" />,
  <MenuItem key={2} value={60} primaryText="One Minute" />,
  <MenuItem key={3} value={300} primaryText="Five Minutes" />,
  <MenuItem key={4} value={900} primaryText="Fifteen Minutes" />,
  <MenuItem key={5} value={3600} primaryText="One Hour" />,
];
export default class RoomStatus extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            granularity: 10
        }
    }

    get mixins() { return [TimerMixin]; }

    loadCurrentState(gran)  {
        var that = this;
        
        this.serverRequest = ajax.post('environment/status', {
            gran: gran || this.state.granularity,
            deviceId: 'device'//'ESP_1198434'
        });

        this.serverRequest.promise().then(function(data) {
                that.setState(data);
            }, function _fail(err) {
                console.log('failed getting sessions: ' + err);
            });
    }

    granularityChange(granularity) {
        this.setState({granularity: granularity});
        this.loadCurrentState(granularity);
    }

    handleGranularityChange(e, idx, value) {
        this.granularityChange(value);
    }

    componentDidMount() {
        var that = this;
        this.isRefreshing = true;
        (function refresh(){
            that.loadCurrentState.call(that);
            setTimeout(function(){
                if(that.isRefreshing) {
                    refresh();
                }
            }, 5000)
        }());
    }

    componentWillUnmount() {
        if(this.serverRequest) {
            this.serverRequest.abort();
            this.isRefreshing = false;
        }
    }

    render() {
        var history = (this.state || {}).history || [];

        const style = {
            smokerStatusContainer: {
                margin: "10px"
            },
            addButton: {
                float: 'right',
                marginRight: '20px'
            }
        };
        
        var cToF = function(c) {
            return c * 1.8 + 32;
        };

        var temps = history.map(function(hist){
            return {
                timestamp: hist.timestamp, 
                temp: cToF(hist.temperature)
            };
        });

        var that = this;
        return <div>
            <Paper zDepth={1} rounded={false}>
                <div className="row">
                    <div className="col-md-8 col-md-6 hidden-sm-down">
                        <SelectField
                            value={this.state.granularity}
                            onChange={this.handleGranularityChange.bind(this)}
                            floatingLabelText="Graph Granularity"
                            floatingLabelFixed={true}
                            >
                            {granularityOptions}
                            </SelectField>
                    </div>
                    <div className="col-md-4 col-sm-12">
                    </div>

                </div>
            </Paper>
            <LineChart history={temps || []}/>
        </div>;
    }

}