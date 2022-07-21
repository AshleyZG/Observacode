import React from 'react';
import { CodeBlock } from "react-code-blocks";
import { historyEvent } from './timelineWidget';
import { scaleLog } from 'd3-scale';

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
};
interface ClusterState {
    selectedErrorMessage: ErrorMessage,
    selectedIndex: number,
};

export class ClusterWidget extends React.Component<ClusterProps, ClusterState>{

    constructor(props: ClusterProps){
        super(props);

        this.state = {
            selectedErrorMessage: this.props.errorMessages[0],
            selectedIndex: 0,
        }

        this.next = this.next.bind(this);
        this.previous = this.previous.bind(this);
    }

    next(){
        var index = this.state.selectedIndex;
        index+=1;
        if (index===this.props.errorMessages.length){
            index = 0;
        }
        this.setState({
            selectedIndex: index,
            selectedErrorMessage: this.props.errorMessages[index]
        });
    }

    previous(){
        var index = this.state.selectedIndex;
        index-=1;
        if (index===-1){
            index += this.props.errorMessages.length;
        }
        this.setState({
            selectedIndex: index,
            selectedErrorMessage: this.props.errorMessages[index]
        });
    }

    render(): React.ReactNode {
        var domainStart: number | undefined = undefined;
        var domainEnd: number | undefined = undefined;
        var names: string[] = Array.from(this.props.events.keys());
        
        names.forEach((name: string) => {
            if (!this.props.events.has(name) || this.props.events.get(name)!.length===0){
                return;
            }
            // set domainStart
            domainStart = domainStart===undefined? this.props.events.get(name)![0].startTime : Math.min(domainStart, this.props.events.get(name)![0].startTime);
            // set domainEnd
            domainEnd = domainEnd===undefined? this.props.events.get(name)![this.props.events.get(name)!.length-1].startTime : Math.max(domainEnd, this.props.events.get(name)![this.props.events.get(name)!.length-1].startTime)
        })

        const timeScaler = scaleLog()
            .domain((domainStart!==undefined && domainEnd!==undefined)? [domainStart+1, domainEnd+1] : [1,10])
            .range([2, 200-2])

        const logScaler = scaleLog()
            .domain([1, 1000])
            .range([5, 20])

        return <div className='code-group-block'>
            {/* Error type */}
            <span>{this.props.errorType}</span>
            {/* Mirror timeline of selected person */}
            <div>
                <svg
                    width={300}
                    height={40}
                >
                    <g >
                        <path className='x-axis' d={`M0 20 L200 20`} stroke={"black"}></path>
                    </g>
                    <g>
                        {this.props.events.get(this.state.selectedErrorMessage.name)?.map((event: historyEvent, index: number) => {
                            return <g key={index}>
                            <rect 
                                className='event-item'
                                height={logScaler(event.radius)} 
                                width={1}
                                x={timeScaler(event.startTime+1)} 
                                y={20-logScaler(event.radius)}
                                data-index={index}
                                data-title={name}
                                data-tooltip={event.tooltip}
                                fill={event.correct? 'green': 'red'}
                                fillOpacity={index===this.state.selectedErrorMessage.submissionIndex? '100%' : '20%'}
                            />
                        </g>
                        })}
                    </g>
                </svg>
            </div>
            {/* Error message of selected example */}
            <div><span>{this.state.selectedErrorMessage.eMessage}</span></div>
            {/* Error code */}
            <div className='code-editor-preview'>
                <CodeBlock
                    text={this.state.selectedErrorMessage.code}
                    language={"python"}
                    highlight={String(this.state.selectedErrorMessage.lineIndex)}
                    wrapLines
                    max={15}
                />
            </div>
            <div>
                <button onClick={this.previous}>Prev</button>
                <button onClick={this.next}>Next</button>
            </div>
        </div>
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
};
interface OverCodeClusterState {
    selectedCode: string;
    selectedIndex: number;
};



export class OverCodeClusterWidget extends React.Component<OverCodeClusterProps, OverCodeClusterState>{
    constructor(props: OverCodeClusterProps){
        super(props);
        this.state = {
            selectedCode: this.props.cluster.members[0],
            selectedIndex: 0,
        }
        this.previous = this.previous.bind(this);
        this.next = this.next.bind(this);
        
    }

    previous(){
        var index = this.state.selectedIndex;
        index-=1;
        if (index===-1){
            index+=this.props.cluster.count;
        }
        this.setState({
            selectedCode: this.props.cluster.members[index],
            selectedIndex: index,
        })
    }

    next(){
        var index = this.state.selectedIndex;
        index+=1;
        if (index===this.props.cluster.count){
            index=0;
        }
        this.setState({
            selectedCode: this.props.cluster.members[index],
            selectedIndex: index,
        })
    }

    render(): React.ReactNode {

        return <div className='code-group-block'>
            {/* cluster id */}
            <span>Cluster {this.props.cluster_id}, {this.props.cluster.count} solutions</span>

            <div className='code-editor-preview'>
                <CodeBlock
                    text={this.state.selectedCode}
                    language={"python"}
                />
            </div>
            <div>
                <button onClick={this.previous}>Prev</button>
                <button onClick={this.next}>Next</button>
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