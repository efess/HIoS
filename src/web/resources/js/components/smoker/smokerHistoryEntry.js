import React from 'react';
import ajax from '../../app/ajax';
import time from '../../app/time';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

import MenuItem from 'material-ui/MenuItem';
import {List, ListItem, MakeSelectable} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import SmokerHistoryEntrySummary from './smokerHistoryEntrySummary';
import SmokerHistoryGraph from './smokerHistoryGraph';

export default class SmokerHistoryEntry extends React.Component {

    constructor(props){
        super(props);
        this.state = {
        }
    }

    sessionId() {
        return this.props && this.props.args && this.props.args[0];
    }
    
    probeId() {
        return this.state.session && this.state.session.probeId || 0;
    }

    componentDidMount() {
        var that = this;
        
        this.serverRequest = Promise.all([
            ajax.post('smokes/getSmokerSession', {
                deviceId: '31316536-6633-3939-2d64-6362372d3436',
                sessionId: that.sessionId()
            }).promise().then(function _success(data) {
                that.setState({session: data.session});
            })
        ]).then(function() {}, function _fail(err) {
            console.log('failed getting sessions: ' + err);
        });
    }

    componentWillUnmount() {
        if(this.serverRequest && this.serverRequest.abort) {
            this.serverRequest.abort();
        }
    }

    graphData() {
        if(!this.state || !this.state.history || !this.state.session) {
            return [[]] ;
        }

        return [
            this.state.history.probeDetail[0].history.data,
            this.state.history.probeDetail[this.state.session.probeId].history.data
        ];
    }

    render() {
        return <div>
            <SmokerHistoryEntrySummary session={this.state.session}/>
            <SmokerHistoryGraph 
                sessionId={this.sessionId()}
                probeId={this.probeId()}/>
        </div>;
    }

}