var $ = require('jquery');

import ReactDOM from'react-dom';
import React from 'react'; 
import RoomStatus from '../components/environment/roomStatus';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

$(document).ready(function(){
    
    var domElement = document.getElementById('room-status');
    if(domElement) {
        ReactDOM.render(
            <MuiThemeProvider muiTheme={getMuiTheme()}>
                <RoomStatus/>   
            </MuiThemeProvider>
            ,
            domElement
        );
    }    
});