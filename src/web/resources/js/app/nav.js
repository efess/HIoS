import $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import AppNav from '../components/appNav';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import SmokerStatus from '../components/smoker/smokerStatus';
import UndercabinetLightControl from '../components/undercabinetLightControl';

var simpleRoutes = {
    '#/smokes': <SmokerStatus/>,
    '#/undercabinet': <UndercabinetLightControl/>
}
     
function routeHash() {
    var loc = window.location.hash;
    var locTokens = loc.replace('#', '').split('/');
    var contentComponent = null;


    if(simpleRoutes[loc]){
        contentComponent = simpleRoutes[loc];
    }

    if(contentComponent) {
        ReactDOM.render(
            <MuiThemeProvider muiTheme={getMuiTheme()}>{contentComponent}</MuiThemeProvider>
            , 
            document.getElementById('main')
        );
    }
}

$(window).on('hashchange', routeHash);

$(document).ready(function(){
    ReactDOM.render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <AppNav/>
        </MuiThemeProvider>
        , 
        document.getElementById('nav-bar')
    );

    routeHash();
});

export default {};