import React from 'react';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import BbqTempRow from './bbqTempRow';
import TopStuff from './topStuff';
import AddSession from './addSession';
import ajax from '../../app/ajax';
import $ from 'jquery';
import TimerMixin from 'react-timer-mixin';

export default class PastSession extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            granularity: 10
        }
    }

    render() {
        <div>
        </div>
    }
}