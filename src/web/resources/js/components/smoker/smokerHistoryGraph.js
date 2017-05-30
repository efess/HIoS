import React from 'react';
import ajax from '../../app/ajax';
import time from '../../app/time';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

import MenuItem from 'material-ui/MenuItem';
import {List, ListItem, MakeSelectable} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import TempGraph from './tempGraph';

export default class SmokerHistoryGraph extends React.Component {

    constructor(props){
        super(props);
        this.state = {};
    }

    getSessionEvents(gran) {
        var that = this;
        this.setState({loading: true});
        return ajax.post('smokes/getSmokerSessionEvents', {
            deviceId: '31316536-6633-3939-2d64-6362372d3436',
            gran: gran,
            sessionId: this.props.sessionId
        }).promise().then(function _success(data) {
            that.setState({history: data, granularity: gran, loading: false});
        });
    }

    componentDidMount() {
        var that = this;
        
        this.serverRequest = this.getSessionEvents(this.prop && this.prop.granularity || 3600)
            .then(function() {}, function _fail(err) {
                console.log('failed getting sessions: ' + err);
            });
    }

    componentWillUnmount() {
        if(this.serverRequest && this.serverRequest.abort) {
            this.serverRequest.abort();
        }
    }
    
    // componentWillReceiveProps(nextProps){
    //     this.getSessionEvents();
    // }

    graphData() {
        if(!this.state || !this.state.history || !this.props.probeId) {
            return [[]] ;
        }

        return [
            this.state.history.probeDetail[0].history.data,
            this.state.history.probeDetail[this.props.probeId].history.data
        ];
    }

    expandGraph() {
        var newGran = parseInt(this.state.granularity / 2);
        if(newGran > 3600) {
            this.getSessionEvents(newGran);
        }
    }

    contractGraph() {
        var newGran = this.state.granularity * 2;
        if(newGran < 99999999) {
            this.getSessionEvents(newGran);
            //this.setState({granularity: newGran});
        }
    }

    render() {
        return <div disabled={this.state.loading}>
            <button onClick={this.expandGraph.bind(this)}>+</button>
            <button onClick={this.contractGraph.bind(this)}>-</button>
            <TempGraph datasets={this.graphData()}/>
        </div>;
    }

}