import $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import AppNav from '../components/appNav';
 import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme';

var NavBar = {};

$(document).ready(function(){
    ReactDOM.render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <AppNav/>
        </MuiThemeProvider>
        ,
        document.getElementById('nav-bar')
    );
}); 
 
 
export default NavBar;