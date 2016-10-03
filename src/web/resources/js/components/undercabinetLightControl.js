import React from 'react';
import RoomStateSettings from './roomStateSettings';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import TextField from 'material-ui/TextField'
import injectTapEventPlugin from 'react-tap-event-plugin';
import ajax from '../app/ajax';
import $ from 'jquery'

injectTapEventPlugin();

const rssStyle = {
    width: '200px',
    float: 'left'
}

const defaultOccupied = {
    brightness: 3,
    animation: 2,
    transition: 1,
    color: 2314241
}

export default class UndercabinetLightControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 'occupied',
        };
         
        this.handleChange = this.handleChange.bind(this);
    }
    
    sendUpdate(newState) {
        var payload = {
            color: (newState.occupied || {}).color || 0,
            options: {
                occupied: newState.occupied,
                unoccupied: newState.unoccupied
            }
        }
        
        ajax.post('/undercabinet/changeOptions', JSON.stringify(payload), {
            contentType: "application/json; charset=utf-8"});
    }
    
    // getInitialState() {
    //     return {
            
    //     };
    // }
    
    
    componentDidMount() {
        var component = this;
        this.serverRequest =  ajax.post('/undercabinet/getState', '')
            .promise()
            .then(function(resp) {
                
                // var newState = {
                //     pirTimeout: 2700,
                //     unoccupied: resp.options.unoccupied,
                //     occupied: resp.options.occupied
                // };
                
                // newState.unoccupied.color = resp.color;
                // newState.unoccupied.pallete = resp.pallete;
                
                // newState.occupied.color = resp.color;
                // newState.occupied.pallete = resp.pallete;
                
                component.setState(resp.options);
            }, function _fail() {
                // statusBox.addClass('error-message');
                // statusBox.text("Failed polling device... Yell at Joe!");
                // statusBox.show();
            });
    }

    updateRoomSettings(name) {
        return function(key,value) {
            if(!this.state[name]) {
                this.state[name] = {};
            }
            var settings = this.state[name];
            settings[key] = value;
            this.sendUpdate(this.state);
            
            var update = {};
            update[name] = settings;
            this.setState(update);
        }
    }
    
    componentWillUnmount() {
    }
    
    handleChange(value){
        this.setState({
            value: value,
        });
    } 
    
    
    render() {
        var divStyle = {
            marginTop: '20px'
        };
        return <div>
                    
                    <Tabs value={this.state.value} onChange={this.handleChange}>
                        <Tab label="Occupied" value="occupied">
                            <div style={divStyle}>
                                <RoomStateSettings 
                                    data={this.state.occupied} 
                                    updateValue={this.updateRoomSettings('occupied').bind(this)} />
                            </div>
                        </Tab>
                        
                        <Tab label="UnOccupied" value="unoccupied">
                            <div style={divStyle}> 
                                <RoomStateSettings 
                                    data={this.state.unoccupied}
                                    updateValue={this.updateRoomSettings('unoccupied').bind(this)} />
                            </div>
                        </Tab>
                    </Tabs>
                </div>;
    }
}