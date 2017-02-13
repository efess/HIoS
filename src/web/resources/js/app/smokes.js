var $ = require('jquery');

import ReactDOM from'react-dom';
import React from 'react'; 
import SmokerStatus from '../components/smoker/smokerStatus';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

$(document).ready(function(){
    
    var domElement = document.getElementById('smoker-status');
    if(domElement) {
        ReactDOM.render(
            <MuiThemeProvider muiTheme={getMuiTheme()}>
                <SmokerStatus/>
            </MuiThemeProvider>
            ,
            domElement
        );
    }    
});