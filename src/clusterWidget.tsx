import React from 'react';
import { CodeBlock } from "react-code-blocks";

interface ErrorMessage {
    eType: string,
    eMessage: string,
    lineIndex: number,
    code: string
}

interface ClusterProps {
    errorType: string,
    errorMessages: ErrorMessage[]
};
interface ClusterState {
    selectedErrorMessage: ErrorMessage,
};

export class ClusterWidget extends React.Component<ClusterProps, ClusterState>{
    constructor(props: ClusterProps){
        super(props);

        this.state = {
            selectedErrorMessage: this.props.errorMessages[0],
        }

        this.selectCode = this.selectCode.bind(this);
    }

    selectCode(event: React.MouseEvent){
        var index = parseInt(event.currentTarget.getAttribute('data-index')!);
        this.setState({selectedErrorMessage: this.props.errorMessages[index]});
    }

    render(): React.ReactNode {
        return <div>
            <span>{this.props.errorType}</span>
            <div>
                {this.props.errorMessages.map((value, index) => {
                    return <div className='select-box' data-index={index} onMouseOver={this.selectCode}></div>
                })}
            </div>
            <div><span>{this.state.selectedErrorMessage.eMessage}</span></div>
            <div className='code-editor-preview'>
                <CodeBlock
                    text={this.state.selectedErrorMessage.code}
                    language={"python"}
                    highlight={String(this.state.selectedErrorMessage.lineIndex)}
                />
            </div>
        </div>
    }
}