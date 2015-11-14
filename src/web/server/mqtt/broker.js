var mosca = require('mosca');

var broker = {
    start: function(){
        
        // var pubsubsettings = {
        //     type: 'redis',
        //     redis: require('redis'),
        //     db: 0,
        //     port: 6379,
        //     return_buffers: true, // to handle binary payloads
        //     host: "localhost"
        // };
        
        var mongobackend = {
            //using ascoltatore
            type: 'mongo',
            url: 'mongodb://localhost:27017/mqtt',
            pubsubCollection: 'ascoltatori',
            mongo: {}
        };
                    
        var settings = {
            port: 1880,
            backend: mongobackend
        };
        
        var server = new mosca.Server(settings);
        
        server.on('clientConnected', function(client) {
            console.log('client connected', client.id);
        });
        
        // fired when a message is received
        server.on('published', function(packet, client) {
            console.log('Published', packet.payload);
        });
        
        server.on('published', function(packet, client) {
            console.log('Published', packet);
            console.log('Client', client);
        });
        
        server.on('ready', setup);
        
        // fired when the mqtt server is ready
        function setup() {
            console.log('Mosca server is up and running');
        }
    }
} 

module.exports = broker;