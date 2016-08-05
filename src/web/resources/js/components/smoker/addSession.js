import React from 'react';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';


export default class AddSession extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            addIsOpen: false,
            newProbe: {
                probeId: 0
            }
        };
    }

    handleOpen() {
        this.setState({addIsOpen: true});
    }

    handleClose() {
        this.setState({addIsOpen: false});
    }

    handleAddAndClose() {
        this.setState({addIsOpen: false});
        if(this.props && this.props.onAddProbe) {
            this.props.onAddProbe(this.state.newProbe);
        }
    }

    handleProbechange(e, idx, value){
        var newProbe = this.state.newProbe;
        newProbe.probeId = value;
        this.setState({newProbe: newProbe});
    
    }
    handleChange(field) {
        return function(e, value){
            var newProbe = this.state.newProbe;
            newProbe[field] = value;
            this.setState({newProbe: newProbe});
        }
    }

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                onTouchTap={this.handleClose.bind(this)}
            />,
            <FlatButton
                label="Add"
                primary={true}
                onTouchTap={this.handleAddAndClose.bind(this)}
            />
        ];
        const style = {
            addDialog: {

            }
        }

        var availableProbes = this.props.availableProbes || [];
        var button = null;
        if(availableProbes.length) {
            button = <FloatingActionButton style={style.addButton}
                onTouchTap={this.handleOpen.bind(this)}>
                <ContentAdd />
            </FloatingActionButton>;
        }
        return <div>
        
            {button}
            
            <Dialog
            title="Add new meat Sensor"
            actions={actions}
            modal={false}
            open={this.state.addIsOpen}
            contentStyle={style.addDialog}
            onRequestClose={this.handleClose.bind(this)}
            >
                <TextField
                    hintText="Hint Text"
                    onChange={this.handleChange('meat').bind(this)}
                    floatingLabelText="Meat"/>
                    
                <TextField
                    hintText="Hint Text"
                    onChange={this.handleChange('target').bind(this)}
                    floatingLabelText="Target Temp"/>
                
                <SelectField value={this.state.newProbe.probeId}
                    floatingLabelText="Which probe?"
                    onChange={this.handleProbechange.bind(this)}>
                    {
                        availableProbes.map(function(probeId) {
                            return <MenuItem 
                                value={probeId} 
                                key={probeId}
                                primaryText={'Probe ' + probeId} 
                                />;
                        })
                    }
                </SelectField>
            </Dialog>
        </div>
    }
}