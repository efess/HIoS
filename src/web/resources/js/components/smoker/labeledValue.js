import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';

export default class LabeledValue extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            open: false
        };
    }

    static get defaultProps() {
        return {
        	value: '',
            name:'Value',
            change: function() {},
            color: '#663300',
            size: '4'
        }
    }
    handleOpen() {
        this.setState({open: true});
    };

    handleClose() {
        this.setState({open: false});
        if(this.state.newVal){
            this.props.change(this.state.newVal)
        }

    };

    handleValueChange(e, newVal) {
        this.setState({newVal: newVal})
    }

    render() {

        var props = this.props || {};
        var dialogStyle = {
            //width: '25%'
        }
        var valStyle = {
            font: "tahoma",
            fontSize: props.size + 'rem',
            color: props.color,
            fontWeight: '700'
        }


        const actions = [
            <FlatButton
                label="Ok"
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.handleClose.bind(this)}
            />,
        ];

        var title = this.props.title || "Change " + this.props.name; 
        
        return (
            <div>
                <span style={valStyle} onTouchTap={this.handleOpen.bind(this)}>{this.props.value}°</span>

                <Dialog
                title={title}
                actions={actions}
                modal={false}
                open={this.state.open}
                contentStyle={dialogStyle}
                onRequestClose={this.handleClose.bind(this)}
                >
                    <TextField hintText={this.props.name} inputStyle={valStyle} onChange={this.handleValueChange.bind(this)}/>
                </Dialog>
            </div>
        );
    }
}