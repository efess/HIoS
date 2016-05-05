import React from 'react';
import R from 'ramda';
import Pallete from './pallete';
import Slider from 'material-ui/lib/slider';
import SelectField from 'material-ui/lib/SelectField';
import MenuItem from 'material-ui/lib/menus/menu-item';
import { SketchPicker } from 'react-color';
import Modal from 'react-modal';

const animations = [
  <MenuItem value={0} primaryText="None"/>,
  <MenuItem value={1} primaryText="Color motion"/>,
  <MenuItem value={2} primaryText="Twinkle"/>,
  <MenuItem value={3} primaryText="Rainbow"/>,
  <MenuItem value={4} primaryText="Runner"/>,
  <MenuItem value={5} primaryText="Discrete"/>,
  <MenuItem value={6} primaryText="Fire"/>,
  <MenuItem value={7} primaryText="Frequency"/>
];

const transitions = [
  <MenuItem value={0} primaryText="None"/>,
  <MenuItem value={1} primaryText="Fade"/>,
  <MenuItem value={2} primaryText="Pixelate"/>
];

function createPropSetter(propName) {
    return function(e, value) {
        var obj = {};
        
        // hack.
        if(propName === 'color') {
            value = transformRgbToColor(value);
        }
        
        
        obj[propName] = value;
        this.setState(obj);
        this.props.updateValue(propName, value);
    }
}

function transformRgbToColor(color) {
    var rgb = color.rgb;
    
    return (rgb.r << 16) | (rgb.g << 8) | rgb.b; 
}
export default class RoomStateSettings extends React.Component {
    
    constructor(props){
        super(props);
        
        this.state = {
            brightness: 4,
            animation: 4,
            transition: 1,
            displayColorPicker: false
        };
        this.colorSelect = this.colorSelect.bind(this);
        this.colorClick = this.colorClick.bind(this);
        this.colorClose = this.colorClose.bind(this);
    }
    
    // handleBrightnessChange(value) {
        
    // }
    // handleAnimationChange(){}
    // handleTransitionChange
    colorSelect(value) {
        value = transformRgbToColor(value);
        
        this.setState({ color: value });
    }
    
    colorClick() {
        this.setState({ displayColorPicker: !this.state.displayColorPicker });
    }

    colorClose() {
        this.setState({ displayColorPicker: false });
        
        this.props.updateValue('color', this.state.color);
    }
    
    render() {
        Modal.setAppElement(document.body);
        var data = this.props.data || {};
        var decColor = this.state.color || data.color || 0;
        
        var color = { 
            r: decColor >> 16,
            g: (decColor >> 8) & 0xFF, 
            b: decColor & 0xFF 
        }
        
        var minMax = function(min, max, value) {
            return value < min ? 0 :
                value > max ? max : value;
        }
        
        var s = {
            label: { 
                //display: 'table-cell', 
                //width: '120px', 
                textAlign: 'right',
                verticalAlign: 'top', 
                paddingTop: '15px'
            },
            control: { 
                //display: 'table-cell' 
                
            },
            row: { 
                //display: 'table-row' 
            },
            section: {float: 'left'},
            color: {
                width: '70px',
                height: '45px',
                borderRadius: '4px',
                background: 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')',
            },
            swatch: {
                padding: '5px',
                background: '#fff',
                borderRadius: '1px',
                boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                display: 'inline-block',
                cursor: 'pointer',
            },
            modal: {
                overlay : {
                    position          : 'fixed',
                    top               : 0,
                    left              : 0,
                    right             : 0,
                    bottom            : 0,
                    backgroundColor   : 'rgba(255, 255, 255, 0.75)',
                    zIndex            : 3
                },
                content:{
                    border: '0',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.0)',
                    top: '90px',
                    right: '60px',
                    bottom: 'auto',
                    left: 'auto'
                    //boxShadow: '0 2px 10px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.16)'
                }
            }
        };
           
        return (
            <div className='container-fluid'>
                <div className="row">
                    <div className="col-sm-6">
                        <div style={s.row} className="row">
                            <div style={s.label} className="col-xs-4">Color</div>
                            <div style={s.control} className="col-xs-8">
                                <div style={s.swatch} onClick={ this.colorClick }>
                                    <div style={s.color} />
                                </div>
                                <Modal
                                    isOpen={this.state.displayColorPicker}
                                    onRequestClose={this.colorClose}
                                    style={s.modal} >
                                    <div>
                                        <SketchPicker 
                                            color={ color }
                                            onChangeComplete={ this.colorSelect }
                                            type='sketch'
                                            />
                                    </div>
                                </Modal>
                            </div>
                        </div> 
                    </div>
                    <div className="col-sm-6">
                        <div style={s.row} className="row">
                            <div style={s.label} className="col-xs-4">Brightness</div>
                            <div style={s.control} className="col-xs-8"><Slider
                                    value={minMax(0, 15, data.brightness)}
                                    min={0}
                                    max={15}
                                    step={1}
                                    onChange={createPropSetter('brightness').bind(this)}/></div>
                        </div> 
                        <div style={s.row} className="row">
                            <div style={s.label} className="col-xs-4">Animation</div>
                            <div style={s.control} className="col-xs-8"><SelectField
                                    fullWidth={true}
                                    value={data.animation}
                                    onChange={createPropSetter('animation').bind(this)}
                                >{animations}
                                </SelectField>
                            </div>
                        </div>
                        
                        <div style={s.row} className="row">
                            <div style={s.label} className="col-xs-4">Transition</div>
                            <div style={s.control} className="col-xs-8"><SelectField
                                    fullWidth={true}
                                    value={data.transition}
                                    onChange={createPropSetter('divansition').bind(this)}
                                >{transitions}
                                </SelectField>
                            </div>
                        </div>
                        <div style={s.row} className="row">
                            <div style={s.label} className="col-xs-4">Pallete</div>
                            <div style={s.control} className="col-xs-8"><Pallete 
                                pallete={data.pallete} 
                                updateValue={createPropSetter('pallete').bind(this)} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>  
        ); 
        
        // return (
        //     <div>
        //         <div style={s.section}>
        //             Ambient Color: 
        //             <div style={s.swatch} onClick={ this.colorClick }>
        //                 <div style={s.color} />
        //             </div>
        //             <Modal
        //                 isOpen={this.state.displayColorPicker}
        //                 onRequestClose={this.colorClose}
        //                 style={s.modal} >
        //                 <ColorPicker 
        //                     type="sketch" 
        //                     color={ color }
        //                     onClose={ this.colorClose }
        //                     onChangeComplete={ this.colorSelect }/>
        //             </Modal>
        //         </div>
        //         <div style={s.section}>
        //             <div style={s.row}>
        //                 <div style={s.label}>Brightness</div>
        //                 <div style={s.control}><Slider
        //                         value={minMax(0, 15, data.brightness)}
        //                         min={0}
        //                         max={15}
        //                         step={1}
        //                         onChange={createPropSetter('brightness').bind(this)}/></div>
        //             </div> 
        //             <div style={s.row}>
        //                 <div style={s.label}>Animation</div>
        //                 <div style={s.control}><SelectField
        //                         value={data.animation}
        //                         onChange={createPropSetter('animation').bind(this)}
        //                     >{animations}
        //                     </SelectField>
        //                 </div>
        //             </div>
                    
        //             <div style={s.row}>
        //                 <div style={s.label}>trvansition</div>
        //                 <div style={s.control}><SelectField
        //                         value={data.transition}
        //                         onChange={createPropSetter('divansition').bind(this)}
        //                     >{transitions}
        //                     </SelectField>
        //                 </div>
        //             </div>
        //         </div>
        //     </div>  
        // ); 
    }
}