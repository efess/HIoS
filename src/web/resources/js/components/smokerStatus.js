import React from 'react';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import BbqTempRow from './bbqTempRow';
import TextField from 'material-ui/TextField';
import ajax from '../app/ajax';
import $ from 'jquery';

export default class SmokerStatus extends React.Component {

    constructor(props){
        super(props);
    }

    getRequestQuery(){
        return "smokes/status2";
    }

    // getInitialState() {
    //     return {
    //         temps:  []
    //     };
    // }

  componentDidMount() {
    this.serverRequest = $.get(this.getRequestQuery(), function (result) {
      
      this.setState(result);

    }.bind(this));
  }

  componentWillUnmount() {
    this.serverRequest.abort();
  }
    render() {
        var output = (this.state || {}).temps || [];
        //var output = [];
        var style = {
            smokerStatusContainer: {
                margin: "10px"
            }
        }
        return <div style={style.smokerStatusContainer}>
            {
                output.map(function(temp, i){
                    return <BbqTempRow data={temp} key={i} />;
                })  
            }
        </div>;
    }

}