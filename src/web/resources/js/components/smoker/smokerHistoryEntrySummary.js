import React from 'react';
import Paper from 'material-ui/Paper';

export default class SmokerHistoryEntrySummary extends React.Component {
    constructor(props){
        super(props);
        this.state = {}
    }

    epochToDateTime(epoch) {
        var date = new Date(epoch);
        return date.toLocaleString();
    }

    durationToString(start, end) {
        var msDiff = end - start;
        var minutes = msDiff / (1000 * 60);
        var minFinal = parseInt(minutes % 60);
        var hours = parseInt(minutes / 60);

        return hours + ":" + minFinal;
    }

    render() {
        var that = this;
        var session = this.props && this.props.session || {};

        var style = {
            title: {
                font: "tahoma",
                fontSize: '2rem',
                color: '#663300',
                fontWeight: '700'
            },
            field: {
                font: "tahoma",
                fontSize: '2rem',
                color: '#333366',
                fontWeight: '700'
            },
            value: {
                font: "tahoma",
                fontSize: '2rem',
                color: '#888888',
                fontWeight: '700'
            }
        };

        return <Paper zDepth={1} rounded={false}>
            <div style={style.title} className="row">
                <div className="col-md-6 col-sm-12">
                    <div className="row">
                        <div className="col-md-6 col-lg-3 col-sm-12">
                            <div>{session.name || '--'}</div>
                        </div>
                        <div className="col-md-6 col-sm-12">
                            <div>
                                <div style={style.field}>Start</div>
                                <div style={style.value}>{session.start && this.epochToDateTime(session.start) || '--'}</div>
                            </div>
                            <div>
                                <div style={style.field}>End</div>
                                <div style={style.value}>{session.end  && this.epochToDateTime(session.end) || '--'}</div>
                            </div>
                        </div>
                        <div className="col-md-6  col-lg-3 col-sm-12">
                            <div>
                                <div style={style.field}>Duration</div>
                                <div style={style.value}>{session.start && this.durationToString(session.start,session.end) || '--'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-12">
                    <div>
                        <div style={style.field}>How'd it go?</div>
                        <div style={style.value}>{session.description || '--'}</div>
                    </div>
                </div>
            </div>
        </Paper>;
    }
}

