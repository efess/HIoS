import React from 'react';
import Tabs from 'material-ui/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import BbqTempRow from './bbqTempRow';
import TopStuff from './topStuff';
import AddSession from './addSession';
import ajax from '../../app/ajax';
import $ from 'jquery';
import TimerMixin from 'react-timer-mixin';

export default class SmokerStatus extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            granularity: 10
        }
    }

    get mixins() { return [TimerMixin]; }

    loadCurrentState()  {
        var that = this;
        return ajax.post('smokes/getSmokerStatus', {
            gran: this.state.granularity,
            deviceId: '31316536-6633-3939-2d64-6362372d3436'
        })
            .then(function(data) {
                that.setState(data);
            }, function _fail(err) {
                console.log('failed getting sessions: ' + err);
            });
    }

    granularityChange(granularity) {
        this.setState({granularity: granularity});
    }

    newProbe(probe) {
        return ajax.post('smokes/newSession', probe)
            .then(this.loadSessions, function _fail(err) {
                console.log('failed creating sessions: ' + err);
            });
    }

    closeSession(session) {
        return ajax.post('smokes/closeSession', session)
            .then(this.loadSessions, function _fail(err) {
                console.log('failed closing session: ' + err);
            });
    }

    updateTarget(probeId, target) {
        return ajax.post('smokes/updateProbeTarget', probe)
            .then(this.loadSessions, function _fail(err) {
                console.log('failed updating target: ' + err);
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
    }

    componentWillUnmount() {
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

        var that = this;
        return <div>
            <TopStuff granularity={this.state.granularity} onGranularityChange={this.granularityChange.bind(this)}/>

            {
                sessions.map(function(session, i){
                    return <BbqTempRow 
                        name={session.name}
                        target={session.target} 
                        probeId={session.probeId}
                        current={probeDetails[session.probeId].current}
                        history={probeDetails[session.probeId].history}
                        closeSession={that.closeSession.bind(that)}
                        key={i} />;
                })
            }
                
            <AddSession 
                availableProbes={availableProbes} 
                onAddProbe={this.newProbe.bind(this)} />
        </div>;
    }

}