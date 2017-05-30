import React from 'react';
import ajax from '../../app/ajax';
import time from '../../app/time';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

import MenuItem from 'material-ui/MenuItem';
import {List, ListItem, MakeSelectable} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';

export default class SmokerHistory extends React.Component {

    constructor(props){
        super(props);
        this.state = {

        }
    }

    componentDidMount() {
        var that = this;
        
        this.serverRequest = ajax.post('smokes/getHistory', {
            deviceId: '31316536-6633-3939-2d64-6362372d3436'
        });

        this.serverRequest.promise().then(function(data) {
                that.setState({history: data});
            }, function _fail(err) {
                console.log('failed getting sessions: ' + err);
            });
    }

    componentWillUnmount() {
        if(this.serverRequest) {
            this.serverRequest.abort();
        }
    }

    rowClicked(rowNum, colNum) {
        var history = this.state && this.state.history;
        if(rowNum < 0 || !history || !history.length) {
            return;
        }
        var hist = history[rowNum];
        var newLoc = '#smokesHistoryEntry/' + hist.tableId; 
        // if(window.history.pushState) {
        //     window.history.pushState(null, null, newLoc);
        // }
        // else {
            window.location.hash = newLoc;
        //}
    }

    render() {
        var history = this.state && this.state.history;
        var that = this;
        var rows = history && history.length && history.map(function(hist, idx) {
            var diff = hist.end - hist.start;
            var duration = time.secondsToDuration(diff);
            var end = new Date(hist.end).toLocaleString();

            return <TableRow key={idx}>
                <TableRowColumn>{hist.tableId}</TableRowColumn>
                <TableRowColumn>{hist.probeId}</TableRowColumn>
                <TableRowColumn>{hist.name}</TableRowColumn>
                <TableRowColumn>{duration}</TableRowColumn>
                <TableRowColumn>{end}</TableRowColumn>
            </TableRow>
        }) || [];

        if(!rows || !rows.length) {
            rows.push(
                <TableRow key={0}>
                    <TableRowColumn></TableRowColumn>
                    <TableRowColumn></TableRowColumn>
                    <TableRowColumn>NO data</TableRowColumn>
                    <TableRowColumn></TableRowColumn>
                    <TableRowColumn></TableRowColumn>
                </TableRow>
            );
        }

        return <Table onCellClick={that.rowClicked.bind(that)}>
            <TableHeader 
                displaySelectAll={false}
                adjustForCheckbox={false}>
                <TableRow>
                    <TableHeaderColumn>ID</TableHeaderColumn>
                    <TableHeaderColumn>Probe Num</TableHeaderColumn>
                    <TableHeaderColumn>Name</TableHeaderColumn>
                    <TableHeaderColumn>Length</TableHeaderColumn>
                    <TableHeaderColumn>End</TableHeaderColumn>
                </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
                {rows}
            </TableBody>
        </Table>
    }

}