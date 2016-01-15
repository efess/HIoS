var localArray = [];

var edison = {
    addEvent: function(value) {
        localArray.push(value);
    },
    getAllEvents: function(){
        return localArray;
    }
}

module.exports = edison;