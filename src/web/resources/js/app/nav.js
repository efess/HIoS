import $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import AppNav from '../components/appNav';

var NavBar = {};

$(document).ready(function(){
    ReactDOM.render(
        <AppNav/>,
        document.getElementById('nav-bar')
    );
}); 
 
 
export default NavBar;