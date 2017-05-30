import React from 'react';
import ReactFauxDOM from 'react-faux-dom';
import ReactDOM from'react-dom';
import Paper from 'material-ui/Paper';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

const granularityOptions = [
  <MenuItem key={1} value={10} primaryText="Ten Seconds" />,
  <MenuItem key={2} value={60} primaryText="One Minute" />,
  <MenuItem key={3} value={300} primaryText="Five Minutes" />,
  <MenuItem key={4} value={900} primaryText="Fifteen Minutes" />,
  <MenuItem key={5} value={3600} primaryText="One Hour" />,
];

export default class TopStuff extends React.Component {

    constructor(props){
        super(props);
    }

    static get defaultProps() {
        return {
            onGranularityChange: function() {},
            granularity: 10
        }
    }

    handleGranularityChange(e, idx, value) {
        this.props.onGranularityChange(value);
    }

        //  Probes
        //             {
        //                 this.props.probes.map(function(probe, id) {
        //                     return <span>{id} - {probe.temp || '---'}</span>
        //                 })
        //             }
    render() {
        var probes = this.props.probes;
        var probeIds = [0,1,2,3];
        var style = {
            tdTemps: {
                width: '80px',
                font: "tahoma",
                fontSize: '1rem',
                color: '#777777',
                fontWeight: '700'
            },
            tdId: {
                font: "tahoma",
                fontSize: '.8rem',
                color: '#777777',
                fontWeight: '700'
            }
        }
        return <Paper zDepth={1} rounded={false}>
            <div className="row">
                <div className="col-md-8 col-md-6 hidden-sm-down">
                    <SelectField
                        value={this.props.granularity}
                        onChange={this.handleGranularityChange.bind(this)}
                        floatingLabelText="Graph Granularity"
                        floatingLabelFixed={true}
                        >
                        {granularityOptions}
                        </SelectField>
                </div>
                <div className="col-md-4 col-sm-12">
                    <table>
                        <tbody>
                            <tr>
                            {
                                probeIds.map(function(idx){
                                    return  <td style={style.tdId} key={idx}>{idx}</td>
                                })
                            }
                            </tr>
                            <tr>
                            {
                                probeIds.map(function(idx){
                                    return  <td style={style.tdTemps} key={idx}>{probes[idx] && probes[idx].temp || '---'}  </td>
                                })
                            }
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </Paper>;
    }
}