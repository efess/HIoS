import $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import AppNav from '../components/appNav';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import SmokerStatus from '../components/smoker/smokerStatus';
import SmokerHistory from '../components/smoker/smokerHistory';
import UndercabinetLightControl from '../components/undercabinetLightControl';
import RoomStatus from '../components/environment/roomStatus';

var simpleRoutes = {
    '#/smokes': <SmokerStatus/>,
    '#/smokesHistory': <SmokerHistory/>,
    '#/undercabinet': <UndercabinetLightControl/>,
    '#/environment': <RoomStatus/>,
}
     
function routeHash() {
    var loc = window.location.hash;
    var locTokens = loc.replace('#', '').split('/').filter(function(item){ return !!item; });
    var contentComponent = null;


    if(simpleRoutes[loc]){
        contentComponent = simpleRoutes[loc];
        if(locTokens.length > 1) {
            contentComponent.args = locTokens.slice(1);
        }
    }

    if(contentComponent) {
        ReactDOM.render(
            <MuiThemeProvider muiTheme={getMuiTheme()}>
                {contentComponent}
            </MuiThemeProvider>
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