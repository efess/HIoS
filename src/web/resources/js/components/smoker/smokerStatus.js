import React from 'react';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import BbqTempRow from './bbqTempRow';
import AddSession from './addSession';
import ajax from '../../app/ajax';
import $ from 'jquery';
import TimerMixin from 'react-timer-mixin';


export default class SmokerStatus extends React.Component {

    constructor(props){
        super(props);
    }

    get mixins() { return [TimerMixin]; }

    loadCurrentState()  {
        var that = this;
        return ajax.post('smokes/getSmokerStatus')
            .then(function(data) {
                that.setState(data);
            }, function _fail(err) {
                console.log('failed getting sessions: ' + err);
            });
    }

    newProbe(probe) {
        return ajax.post('smokes/newSession', probe)
            .then(this.loadSessions, function _fail() {
                console.log('failed creating sessions: ' + err);
            });
    }

    componentDidMount() {
        var that = this;
        (function refresh(){
            that.loadCurrentState.call(that);
            
            setTimeout(function(){
                refresh();
            }, 1000)
        }());
        //this.serverRequest = this.loadSessions();
    }

    componentWillUnmount() {
        //this.serverRequest.abort();
    }

    render() {
        var sessions = (this.state || {}).sessions || [];
        var probeDetails = (this.state || {}).probeDetail || [];

        const probeIds = [1,2,3];
        //var output = [];
        const style = {
            smokerStatusContainer: {
                margin: "10px"
            },
            addButton: {
                float: 'right',
                marginRight: '20px'
            }
        };

        var takenProbes = sessions.map(function(session) { return session.probeId; });
        var availableProbes = probeIds.reduce(function(arr, id){
            if(takenProbes.indexOf(id) < 0) {
                arr.push(id);
            }
            return arr;
        }, []);

        var sessionElements = 
            sessions.map(function(session, i){
                var probeDetail = probeDetails[session.probeId];

                return <BbqTempRow 
                    name={session.name}
                    target={session.target} 
                    probeId={session.probeId}
                    current={probeDetail.current}
                    history={probeDetail.history}
                    key={i} />;
            }) ;
            

        var that = this;
        return <div>
            <div>{sessionElements}</div>
            <AddSession availableProbes={availableProbes} onAddProbe={this.newProbe.bind(this)} />
        </div>;
    }

}