import React from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const presets = {
    party: [
        0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
        0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
        0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
        0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
    ],
    christmas: [
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF,
        0xFF0000, 0xFFFFFF, 0x00FF00, 0xFFFFFF        
    ],
    cute: [
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC,
        0xFFC1A6, 0x62C6AF, 0xE528DC, 0x4E81DC
    ],
    dawn: [
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233,
        0xE1B245, 0xE16C2E, 0xECED0C, 0xEC3233
    ],
    bluegreen: [
        0x0000FF, 0x0000FF, 0x0000FF, 0x0000FF,
        0xFFFFFF, 0xFFFFFF, 0x0000FF, 0x00FF00,
        0x00FF00, 0x0000FF, 0x0000FF, 0xFFFFFF,
        0xFFFFFF, 0x0000FF, 0x00FF00, 0x0000FF        
    ],
    rainbow: [
        0xFF0000, 0xD52A00, 0xAB5500, 0xAB7F00,
        0xABAB00, 0x56D500, 0x00FF00, 0x00D52A,
        0x00AB55, 0x0056AA, 0x0000FF, 0x2A00D5,
        0x5500AB, 0x7F0081, 0xAB0055, 0xD5002B
    ],
    jason: [
        0x84007C, 0x84007C, 0x84007C, 0x0007F9,
        0x0007F9, 0x0007F9, 0x84007C, 0x84007C,
        0x84007C, 0x0007F9, 0x0007F9, 0x0007F9,
        0x84007C, 0x84007C, 0x0007F9, 0x0007F9
    ]
}

function findMatchingPreset(pallete) {
    for(var key in presets) {
        var preset = presets[key];
        
        if(preset.every(function(val, i) { return val === pallete[i];  })) {
            return key;
        };
    }
    // return presets.find(function(preset){
    //     return preset.every(function(val, i) {
    //         return val === pallete[i]; 
    //     });
    // });
}

function getMenuItem(key, preset) {
    function colorToHex(color) {
        return '#' + ('000000' + color.toString(16)).slice(-6); 
    }
    var colorString = preset.reduce(function(str, current, i){
        return str + ', ' + colorToHex(current) + ' ' + Math.round((i / 16) * 100).toString() + '%';
    }, '');
    
    var gradient = {
        background: 'linear-gradient(to right' + colorString + ')'
    };
    
    //background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
    return <MenuItem 
        key={key} 
        value={key} 
        primaryText={key}
        secondaryText="asdf"
        innerDivStyle={gradient}
        />
}

function changePallete(e, index, val) {
    if(!this.props.updateValue){
        return;
    }
    
    this.props.updateValue(this, presets[val]);
}

export default class Pallete extends React.Component {
    
    constructor(props){
        super(props);
    }
    
    render() {
        var selectedKey = this.props.pallete && findMatchingPreset(this.props.pallete) || 'party';
        var menuItems = [];
        
        
        for(var key in presets){
            menuItems.push(getMenuItem(key, presets[key]));
        }
         
        return (
            <div>
                <SelectField 
                    fullWidth={true}
                    value={selectedKey}
                    onChange={changePallete.bind(this)}>
                    {menuItems}
                </SelectField>
            </div>
        ); 
    }
}