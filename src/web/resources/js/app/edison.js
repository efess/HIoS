var $ = require('jquery');
var Promise = require('promise');

var ajax = require('./ajax');

var edison = {
    getEvents: function(){
        ajax.get('/edison/getEvents', {})
            .then(edison.paintPage);
             
    },
    paintPage: function(events){
        $('.paintEvents').html(events);
    }
}

$(document).ready(function(){
   //$('.paintEvents')
   var interval = 0;
   $('#edisonStart').on('click', function() {
       interval = setInterval(function() {
           edison.getEvents();
       }, 100);
   });
         
   $('#edisonStop').on('click', function() {
       clearInterval(interval);
   });
});
module.exports = edison;