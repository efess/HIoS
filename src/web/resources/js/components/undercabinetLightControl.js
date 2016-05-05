import React from 'react';
import RoomStateSettings from './roomStateSettings';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
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
            color: newState.occupied.color,
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
            .then(function(resp) {
                
                var newState = {
                    unoccupied: resp.options.unoccupied,
                    occupied: resp.options.occupied
                };
                
                newState.unoccupied.color = resp.color;
                newState.unoccupied.pallete = resp.pallete;
                
                newState.occupied.color = resp.color;
                newState.occupied.pallete = resp.pallete;
                
                component.setState(newState);
            }, function _fail() {
                // statusBox.addClass('error-message');
                // statusBox.text("Failed polling device... Yell at Joe!");
                // statusBox.show();
            });
            
        // this.serverRequest = $.get(this.props.source, function (result) {
        //     var lastGist = result[0];
        //     this.setState({
        //         username: lastGist.owner.login,
        //         lastGistUrl: lastGist.html_url
        //     });
        // }.bind(this));
    }

    updateRoomSettings(name) {
        return function(key,value) {
            var settings = this.state[name];
            settings[key] = value;
            this.sendUpdate(this.state);
            
            var update = {};
            update[name] = settings;
            this.setState(update);
        }
    }
    
    componentWillUnmount() {
        this.serverRequest.abort();
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