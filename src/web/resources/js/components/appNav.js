import React from 'react';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

// export default class AppNav extends React.Component {

//   constructor(props) {
//     super(props);
//     this.state = {open: false};
//   }

//   handleToggle() {
//     this.setState({open: !this.state.open});
//   }

//   render() {
//     return (
//       <div>
//         <AppBar
//           title="Undercabinet"
//           iconClassNameRight="muidocs-icon-navigation-expand-more"
//         />
        
//         <Drawer open={this.state.open}>
//           <MenuItem>Kitchen</MenuItem>
//           <MenuItem>Smoker</MenuItem>
//         </Drawer>
//       </div>
//     );
//   }
// }

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
    
    render() {
        return (
            <div>
                <AppBar
                    title="Title"
                    iconClassNameRight="muidocs-icon-navigation-expand-more"
                    onLeftIconButtonTouchTap={this.handleToggle.bind(this)}
                />
                <Drawer open={this.state.open} onRequestChange={this.closeDrawer.bind(this)} docked={false}>
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