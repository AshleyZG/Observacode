import React from 'react';
import { CodeBlock } from "react-code-blocks";
import { historyEvent } from './timelineWidget';

/**
 * ClusterWidget<ClusterProps, ClusterState>: React.Component
 * display incorrect solutions that cannot be executed
 * clustered by error type
 */
export interface ErrorMessage {
    eType: string,
    eMessage: string,
    lineIndex: number,
    code: string,
    name: string,
    submissionIndex: number,
}

interface ClusterProps {
    errorType: string,
    errorMessages: ErrorMessage[]
    events: Map<string, historyEvent[]>
    timelineButtonFn?: React.MouseEventHandler<HTMLButtonElement> | undefined
};
interface ClusterState {
};

export class ClusterWidget extends React.Component<ClusterProps, ClusterState>{

    constructor(props: ClusterProps){
        super(props);
    }

    render(): React.ReactNode {
        const title = this.props.errorType;
        const count = this.props.errorMessages.length;
        const codeExamples = this.props.errorMessages.map((value: ErrorMessage)=> {return value.code});
        const messages = this.props.errorMessages.map((value: ErrorMessage)=> {return value.eMessage});
        const highlightLineNumbers = this.props.errorMessages.map((value: ErrorMessage)=>{return value.lineIndex});

        return <BasicClusterWidget
            title={title}
            count={count}
            codeExamples={codeExamples}
            messages={messages}
            highlightLineNumbers={highlightLineNumbers}
        />
    }
}


/**
 * OverCodeClusterWidget<OverCodeClusterProps, OverCodeClusterState>: React.Component
 * display clusters generated by OverCode
 * clustered by computation
 * 
 * would like to have animation - lower priority
 */

export interface OverCodeCluster {
    id: number; // id of the cluster
    correct: boolean; // is the cluster correct?
    count: number; // how many solutions are in this cluster?
    members: string[]; // solutions in this cluster
}
interface OverCodeClusterProps {
    cluster_id: number;
    cluster: OverCodeCluster;
    timelineButtonFn?: React.MouseEventHandler<HTMLButtonElement> | undefined
};
interface OverCodeClusterState {
};

export class OverCodeClusterWidget extends React.Component<OverCodeClusterProps, OverCodeClusterState>{
    constructor(props: OverCodeClusterProps){
        super(props);
    }

    render(): React.ReactNode {

        const title = `Cluster ${this.props.cluster_id}`;
        const count = this.props.cluster.count;
        const codeExamples = this.props.cluster.members;

        return <BasicClusterWidget
            title={title}
            count={count}
            codeExamples={codeExamples}
        />
    }
}

/**
 * Basic cluster widget
 */
 interface BasicClusterProps {
    title: number | string;
    count: number;
    codeExamples: string[];
    messages?: string[];
    highlightLineNumbers?: number[];
    timelineButtonFn?: React.MouseEventHandler<HTMLButtonElement> | undefined
};
interface BasicClusterState {
    selectedIndex: number;
    selectedCode: string;
    selectedMessage?: string;
    selectedHighlightLineNumber?: number;
};

export class BasicClusterWidget extends React.Component<BasicClusterProps, BasicClusterState>{
    constructor(props: BasicClusterProps){
        super(props);
        this.state = {
            selectedIndex: 0,
            selectedCode: this.props.codeExamples[0],
            selectedMessage: this.props.messages? this.props.messages[0]: undefined,
            selectedHighlightLineNumber: this.props.highlightLineNumbers? this.props.highlightLineNumbers[0]: undefined,
        }
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        
    }

    previous(){
        var index = this.state.selectedIndex;
        index-=1;
        if (index===-1){
            index+=this.props.count;
        }
        this.setState({
            selectedCode: this.props.codeExamples[index],
            selectedMessage: this.props.messages? this.props.messages[index]: undefined,
            selectedHighlightLineNumber: this.props.highlightLineNumbers? this.props.highlightLineNumbers[index]: undefined,
            selectedIndex: index,
        })
    }

    next(){
        var index = this.state.selectedIndex;
        index+=1;
        if (index===this.props.count){
            index=0;
        }
        this.setState({
            selectedCode: this.props.codeExamples[index],
            selectedMessage: this.props.messages? this.props.messages[index]: undefined,
            selectedHighlightLineNumber: this.props.highlightLineNumbers? this.props.highlightLineNumbers[index]: undefined,
            selectedIndex: index,
        })
    }

    render(): React.ReactNode {

        return <div className='code-group-block'>
            {/* group title */}
            <span>{this.props.title}, {this.props.count} solutions</span>
            {/* message */}
            <div><span>{this.state.selectedMessage}</span></div>
            {/* code block */}
            <div className='code-editor-preview'>
                <CodeBlock
                    text={this.state.selectedCode}
                    language={"python"}
                    highlight={this.state.selectedHighlightLineNumber? String(this.state.selectedHighlightLineNumber):""}
                />
            </div>
            {/* button group */}
            <div>
                <button onClick={this.previous}>Prev</button>
                <button onClick={this.next}>Next</button>
                <button onClick={this.props.timelineButtonFn? this.props.timelineButtonFn: ()=>{}}>Timeline</button>
            </div>

        </div>
    }
}


/**
 * MyTag: React.Component <MyTagProps, MyTagState>
 * 
 */
interface MyTagProps {
    value: string;
    count: number;
};
interface MyTagState {
};
export class MyTag extends React.Component<MyTagProps, MyTagState>{
    constructor(props: MyTagProps){
        super(props);
    }
    render(): React.ReactNode {
        return <div className='solution-group-tag'>
            {this.props.value} {this.props.count}
        </div>
    }
}