import React from 'react';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

const locationMap = {
    '': 'Home',
    'undercabinet': 'Undercabinet',
    'smokes': 'Smoker'
};

export class AppNav extends React.Component {
    
    constructor(props) {
      super(props);
      this.state = {open: false};
    }

    handleToggle() {
      this.setState({open: !this.state.open});
    }
    
    closeDrawer() { 
      this.setState({ open: false }) 
    }

    currentTitle() {
        var loc = location.href;
        var key = loc.substr(loc.lastIndexOf('/') + 1);
        return locationMap[key] || 'Unknown';
    }
    
    render() {
        return (
            <div>
                <AppBar
                    title={this.currentTitle()}
                    iconClassNameRight="muidocs-icon-navigation-expand-more"
                    onLeftIconButtonTouchTap={this.handleToggle.bind(this)}
                />
                <Drawer open={this.state.open} onRequestChange={this.closeDrawer.bind(this)} docked={false}>
                  <MenuItem href="/">Home</MenuItem>
                  <MenuItem href="/undercabinet">Kitchen</MenuItem>
                  <MenuItem href="/smokes">Smoker</MenuItem>
                </Drawer>
            </div>
        );
    }        
}


// const AppNav = () => (
//   <div>
//     <AppBar
//       title="Undercabinet"
//     />
//   </div>
// );

export default AppNav;