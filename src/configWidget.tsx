import React from 'react';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

interface ConfigPanelProps{
    typingActivityMode: boolean;
    setTypingActivityMode: () => void;
}
interface ConfigPanelState{}
export class ConfigPanel extends React.Component<ConfigPanelProps,  ConfigPanelState>{
    constructor(props: ConfigPanelProps){
        super(props)
    }

    render(){
        return <div className='config-panel'>
            <FormGroup>
                <FormControlLabel control={<Switch checked={this.props.typingActivityMode} onChange={this.props.setTypingActivityMode}/>} label="Typing Activities"/>
            </FormGroup>

        </div>
    }

}