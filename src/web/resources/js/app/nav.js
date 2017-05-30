import $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import AppNav from '../components/appNav';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import SmokerStatus from '../components/smoker/smokerStatus';
import SmokerHistory from '../components/smoker/smokerHistory';
import SmokerHistoryEntry from '../components/smoker/smokerHistoryEntry';
import UndercabinetLightControl from '../components/undercabinetLightControl';
import RoomStatus from '../components/environment/roomStatus';

var simpleRoutes = {
    'smokes': {component: SmokerStatus, options: { }},
    'smokesHistory': {component: SmokerHistory, options: { }},
    'smokesHistoryEntry': {component: SmokerHistoryEntry, options: {nav: 'back' }},
    'undercabinet': {component: UndercabinetLightControl, options: { }},
    'environment': {component: RoomStatus, options: { }}
}

function routeHash() {
    var loc = window.location.hash;
    var locTokens = loc.replace('#', '').split('/').filter(function(item){ return !!item; });
    var contentComponent = null;
    var page = locTokens.length && locTokens[0];
    var navOption = {};
    
    if(simpleRoutes[page]){
        var route = simpleRoutes[page];
        navOption = route.options.nav;
        if(locTokens.length > 1) {
            contentComponent = React.createElement(route.component, {args: locTokens.slice(1)});
        } else {
            contentComponent = React.createElement(route.component, null);
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
    ReactDOM.render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <AppNav navOption={navOption}/>
        </MuiThemeProvider>
        , 
        document.getElementById('nav-bar')
    );
}

$(window).on('hashchange', routeHash);
$(document).ready(routeHash);

export default {};