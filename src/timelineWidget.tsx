import React from 'react';
import * as d3 from 'd3';

import { scaleLog } from 'd3-scale';
import { renderToString } from 'react-dom/server';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { COLOR_MAP } from './color';

export interface historyEvent{
    value: string;
    radius: number;
    startTime: number;
    endTime?: number;
    correct: boolean;
    tooltip: string;
    eMessage: any;
    errorType?: string;
};

export interface typingActivity{
    timestamp: number;
}

interface TimeLineProps {
    width?: number;
    height?: number;
    lanes: string[];
    queryFilter: {[name: string]: number};
    events: Map<string, historyEvent[]>;
    typingActivities: Map<string, typingActivity[]>;
    typingStatus: Map<string, boolean>;
    timelineStart?: number;
    timelineEnd?: number;
    dotOnClick: (event:React.MouseEvent<SVGRectElement>) => void;
    dotOnDragStart: (event: React.DragEvent<SVGRectElement>) => void;
    dotOnHover: (event: React.MouseEvent<SVGRectElement>) => void;
    similarButtonOnClick: (event: React.MouseEvent<SVGRectElement>) => void;
    tooltipMode: boolean;
    typingActivityMode: boolean;
};
interface TimeLineState {
    lanes: string[];
};

class TimeLine extends React.Component<TimeLineProps, TimeLineState> {
    width: number = 400;
    height: number = 200;

    constructor(props: any){
        super(props);
        if ('width' in props){
            this.width = props.width;
        }
        if ('height' in props){
            this.height = props.height;
        }


        this.state = {
            lanes: props.lanes,
        }
        
    }

    componentDidMount(){

        // create tooltip item
        d3.select('.timeline')
            .append('div')
            .classed('tooltip', true)
            .style("position", "fixed")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")
            .style("white-space", "pre-line")
            .html("");    

    }

    componentDidUpdate(){
        // set tooltip animation for each event item
        var tooltip = d3.select('.tooltip');
        var scope = this;
        d3.selectAll('.event-item')
            .each(function (p, j){
                const code = d3.select(this).attr('data-tooltip');
                d3.select(this)
                .on("mouseover", function(){
                    if (!scope.props.tooltipMode) return;
                    // set html for tooltip
                    const node = (<SyntaxHighlighter language='python'>{code}</SyntaxHighlighter>);
                    const html = renderToString(node);
                    return tooltip.style("visibility", "visible")
                        .html(html);})
                .on("mousemove", function(event){
                    if (!scope.props.tooltipMode) return;
                    return tooltip.style("top", (event.clientY)+"px").style("left",(event.clientX)+"px");})
                .on("mouseout", function(){
                    if (!scope.props.tooltipMode) return;
                    return tooltip.style("visibility", "hidden").html("");});
            })
    
        
    }


    barColor(correct: boolean, errorType?: string){
        if (correct){
            return COLOR_MAP['correct'];
        }else if(errorType){
            return COLOR_MAP[errorType];
        }else{
            return COLOR_MAP['cluster-1'];
        }
    }

    render(): React.ReactNode {
        var domainStart: number | undefined = undefined;
        var domainEnd: number | undefined = undefined;

        
        this.state.lanes.forEach((name: string) => {
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
            .range([30, this.width-30])

        const logScaler = scaleLog()
            .domain([1, 1000])
            // .range([10,40])
            .range([this.height/(this.state.lanes.length+1)*0.25, this.height/(this.state.lanes.length+1)])

        return <svg
            width={this.width}
            height={this.height}
        >
            {/* x axis for all lanes */}
            {this.state.lanes.map((value: string, index: number) => {
                return <g key={index}>
                    
                    <path className='x-axis' id={value} d={`M0 ${this.height/this.state.lanes.length*(index+1)} L${this.width} ${this.height/this.state.lanes.length*(index+1)}`} stroke={this.props.queryFilter[value]===0?"black":"teal"}></path>

                </g>
            })}
            {/* TODO: y axis for time stamps */}

            {/* TODO: events */}
            <g id={"events"}>
                {this.state.lanes.map((name: string) => {
                    return <g key={name}>
                        {(this.props.events.has(name)? this.props.events.get(name)!: []).map((event: historyEvent, index: number) => {
                            const ref = React.createRef<SVGRectElement>();

                            return <g key={index}>
                                <rect 
                                    ref={ref}
                                    className='event-item'
                                    height={logScaler(event.radius)} 
                                    width={5}
                                    x={timeScaler(event.startTime+1)} 
                                    y={this.height/this.state.lanes.length*((this.state.lanes.indexOf(name))+1)-logScaler(event.radius)}
                                    data-index={index}
                                    data-title={name}
                                    data-tooltip={event.tooltip}
                                    // stroke={event.correct? 'green': 'red'}
                                    fill={this.barColor(event.correct, event.errorType)}
                                    fillOpacity={'90%'}
                                    onMouseOver={this.props.dotOnHover}
                                    onClick={this.props.dotOnClick}
                                />
                            </g>
                        })}
                        {(this.props.typingActivityMode && this.props.typingActivities.has(name)? this.props.typingActivities.get(name)!: []).map((activity: typingActivity, index: number) => {
                            return <g key={index}>
                                <rect
                                    className='typing-activity'
                                    height={5}
                                    width={0.5}
                                    x={timeScaler(activity.timestamp+1)}
                                    y={this.height/this.state.lanes.length*((this.state.lanes.indexOf(name))+1)-5}
                                    fill={'black'}
                                />
                            </g>
                        })}

                        <circle 
                            r={10}
                            cx={this.width-5}
                            cy={this.height/this.state.lanes.length*((this.state.lanes.indexOf(name))+0.5)}
                            fill={'gray'}
                            display={this.props.typingStatus.get(name)? 'block': 'none'}
                        />
                        <rect
                            className='timeline-button'
                            height={10}
                            width={10}
                            x={5}
                            y={this.height/this.state.lanes.length*((this.state.lanes.indexOf(name))+1)-5}
                            data-title={name}
                            onClick={this.props.similarButtonOnClick}
                        />
                    </g>
                })}

            </g>

        </svg>
    }
}

export {TimeLine};