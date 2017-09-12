import React from 'react';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';

export default class SessionOptions extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            updateIsOpen: false,
            updateSession: {
            }
        };
    }

    handleOpen() {
        this.setState({updateIsOpen: true});
    }

    handleClose() {
        this.setState({updateIsOpen: false});
    }

    handleUpdateAndClose() {
        this.setState({updateIsOpen: false});
        if(this.props && this.props.onCloseSession) {
            this.state.updateSession.tableId = this.props.tableId;
            this.state.updateSession.probeId = this.props.probeId;
            this.state.updateSession.end = new Date().getTime();
            this.props.onCloseSession(this.state.updateSession);
        }
    }
    
    handleChange(field) {
        return function(e, value){
            var updateSession = this.state.updateSession;
            updateSession[field] = value;
            this.setState({updateSession: updateSession});
        }
    }
    handleItemSelect(obj, child) {
        var value = child.props.value;

        switch(value){
            case "done":
                this.handleOpen();
                break;
        }
    }
    

    render() {
        const actions = [
            <FlatButton
                label="Cancel"
                onTouchTap={this.handleClose.bind(this)}
            />,
            <FlatButton
                label="Done"
                primary={true}
                onTouchTap={this.handleUpdateAndClose.bind(this)}
            />
        ];
        
        return <div>
            <IconMenu
                iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                onItemTouchTap={this.handleItemSelect.bind(this)}
                anchorOrigin={{horizontal: 'left', vertical: 'top'}}
                targetOrigin={{horizontal: 'left', vertical: 'top'}}
                >
                <MenuItem key={0} value="done" primaryText="Done" />
            </IconMenu>
            
            <Dialog
                title="Close Session"
                actions={actions}
                modal={true}
                open={this.state.updateIsOpen}
                onRequestClose={this.handleClose.bind(this)}
                >                
                <TextField
                    onChange={this.handleChange('description').bind(this)}
                    floatingLabelText="How did it come out?"
                    floatingLabelFixed={true}
                    multiLine={true}
                    rows={8}
                    fullWidth={true}
                />
            </Dialog>
        </div>
    }
}