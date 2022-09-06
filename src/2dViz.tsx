import React from 'react';
import * as d3 from 'd3';
import { scaleLinear, scaleSequential, scaleLog } from 'd3-scale';
import { DLEvent, MyNode } from './dlViewWidget';
// import { interpolatePath } from 'd3-interpolate'; 
export interface Position{
    x: number,
    y: number,
}

interface PlotVizProps {
    activeUsers: string[];
    events: {[name: string]: DLEvent[]};
    treeNodes: {[key: number]: MyNode};
    rootNode: MyNode;
    leafEvents: {[key: number]: DLEvent};
    nSample: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    radius: number;
    interval: number;   
    maxNumber: number;
    maxDistance: number;
    circleMouseOverFn: (eventList: DLEvent[])=>void;
    circleMouseOutFn: ()=>void;
};
interface PlotVizState {
};

class PlotViz extends React.Component<PlotVizProps, PlotVizState> {

    scalerX: d3.ScaleLinear<number, number, never>;
    scalerY: d3.ScaleLinear<number, number, never>;
    scalerR: d3.ScaleLinear<number, number, never>;
    scalerColor: d3.ScaleSequential<string, never>;
    userCurrentEvent: {[name: string]: DLEvent} = {};
    paths: {[name: string]: d3.Path} = {};
    contourData: [number, number][] = [];

    constructor(props: any){
        super(props);

        const WIDTH = this.props.width;
        const HEIGHT = this.props.height;
        const maxNumber = this.props.maxNumber;

        this.scalerX = scaleLinear().domain([this.props.minX, this.props.maxX]).range([0, WIDTH]);
        this.scalerY = scaleLinear().domain([this.props.minY, this.props.maxY]).range([0, HEIGHT]);
        this.scalerR = scaleLinear().domain([0, maxNumber]).range([0, 40]);
        this.scalerColor = scaleSequential(d3.interpolateRdYlGn).domain([0, 1]);

        this.props.activeUsers.forEach((name: string, index: number) => {
            this.userCurrentEvent[name] = this.props.events[name][0];
            this.paths[name] = d3.path();
            this.paths[name].moveTo(this.scalerX(this.props.events[name][0].x), this.scalerY(this.props.events[name][0].y));
        })

        this.setEventHappen();
        
    }

    setEventHappen(){
        var activeUsers = this.props.activeUsers;
        var events = this.props.events;

        const scope = this;

        const scalerTime = scaleLog()
            .domain([1, 46272942000])
            .range([0, 60*1000])

        // var maxTime = -Infinity;
        activeUsers.forEach((name: string) => {
            events[name].forEach((event: DLEvent, index: number)=>{
                // if (event.timeOffset>maxTime){
                //     maxTime = event.timeOffset;
                // }
                console.log(event.timeOffset+1, scalerTime(event.timeOffset+1));
                setTimeout(()=>{
                    scope.userCurrentEvent[name] = event;
                    scope.paths[name].lineTo(scope.scalerX(event.x), scope.scalerY(event.y));
                    scope.updateGraph(name);
                }, scalerTime(event.timeOffset+1));
            })
        })
        // console.log(maxTime);
    }

    private updateGraph(name: string){
        const graph = d3.select('.viz-canvas')
        const scalerX = this.scalerX;
        const scalerY = this.scalerY;
        const WIDTH = this.props.width;
        const HEIGHT = this.props.height;

        var scope = this;
        var userCurrentEvent = this.userCurrentEvent;
        var d3Paths = this.paths;
        


        // update current dot
        var dot = graph.selectAll('.current-dot').select(function(d, i){return d===name? this: null});
        dot.selectAll('circle')
            .transition()
            .duration(5000)
            .attr('cx', function(d, i){return scalerX(userCurrentEvent[d as string].x);})
            .attr('cy', function(d, i){return scalerY(userCurrentEvent[d as string].y);})
            .attr('fill', function(d, i){return userCurrentEvent[d as string].passTest? 'green':'red';})       
            .on('end', function(d, i){
                // update contour
                scope.contourData[scope.props.activeUsers.indexOf(name)] = [scalerX(userCurrentEvent[name].x), scalerY(userCurrentEvent[name].y)];
                var contours = d3.contourDensity()
                    .x(d => d[0])
                    .y(d => d[1])
                    .size([WIDTH, HEIGHT])
                    .thresholds(3)
                    // .thresholds([0.000375, 0.00025, 0.000125])
                    // .bandwidth(60)
                    (scope.contourData);

                var demapContours: any[] = [];
                contours.forEach((ring: d3.ContourMultiPolygon) => {
                    ring.coordinates.forEach((value) => {
                        demapContours.push({'type': ring.type, 'value': ring.value, 'coordinates': [value]});
                    })
                })

                var blob = graph.select('.blob');

                blob.selectAll('path')
                    .data(demapContours)
                    .join('path')
                    .attr("stroke-width", 1)
                    .attr("d",d3.geoPath())
                    .on('mouseover', function(event, d){
                        const eventList: DLEvent[] = [];
                        scope.props.activeUsers.forEach((name: string) => {
                            var point = ((this as SVGPathElement).parentElement?.parentElement as any).createSVGPoint();
                            point.x = scalerX(userCurrentEvent[name].x);
                            point.y = scalerY(userCurrentEvent[name].y);
                            if ((this as SVGGeometryElement).isPointInFill(point)){
                                console.log(name);
                                eventList.push(userCurrentEvent[name]);
                            }
                        })
                        scope.props.circleMouseOverFn(eventList);
        
                    });
        

            })     

        // update path
        var path = graph.selectAll('.path').select(function(d, i){return d===name? this: null});
        path.selectAll("path")
            .transition()
            .delay(5000)
            .ease(d3.easeLinear)
            .attr('d', function(d, i){
                return d3Paths[d as string].toString();
            })


    }

    addNodeToTree(nodeID: number){
        const nSample = this.props.nSample;

        var node: MyNode | null = this.props.treeNodes[nodeID];
        while(node!==null){
            // if it is a leaf, update count, leafIDs
            if (node.id<nSample){
                node.count+=1;
                node.leafIDs=[node.id];
            }
            // need to update node 1) count, 2) leafIDs, 3) x, 4) y
            else{
                node.count = node.leftChild!.count+node.rightChild!.count;
                node.leafIDs = node.leftChild!.leafIDs.concat(node.rightChild!.leafIDs);
                if (node.count!==0){
                    this.calculateNode(node);
                }
            }
            node = node.parent;
        }

    }

    private initGroup(){
        var activeUsers = this.props.activeUsers;
        var events = this.props.events;

        var userCurrentEvent = this.userCurrentEvent;
        var d3Paths = this.paths;
        var scope = this;

        const WIDTH = this.props.width;
        const HEIGHT = this.props.height;

        const scalerX = this.scalerX;
        const scalerY = this.scalerY;

        const graph = d3.select('.viz-canvas')
                        .attr('width', WIDTH)
                        .attr('height', HEIGHT);

        activeUsers.forEach((value: string, index: number) => {
            this.contourData.push([scalerX(events[value][0].x), scalerY(events[value][0].y)])
        })

        // draw contour
        var contours = d3.contourDensity()
            .x(d => d[0])
            .y(d => d[1])
            .size([WIDTH, HEIGHT])
            .thresholds(3)
            (this.contourData)
        console.log(contours.length)
        var demapContours: any[] = [];
        contours.forEach((ring: d3.ContourMultiPolygon) => {
            ring.coordinates.forEach((value) => {
                demapContours.push({'type': ring.type, 'value': ring.value, 'coordinates': [value]});
            })
        })

        var blob = graph.append('g')
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr('class', 'blob')
        blob.selectAll('path')
            .data(demapContours)
            .join('path')
            .attr("stroke-width", 1)
            .attr('fill', 'none')
            .attr("d",d3.geoPath())
            .on('mouseover', function(event, d){
                const eventList: DLEvent[] = [];
                scope.props.activeUsers.forEach((name: string) => {
                    var point = ((this as SVGPathElement).parentElement?.parentElement as any).createSVGPoint();
                    point.x = scalerX(scope.userCurrentEvent[name].x);
                    point.y = scalerY(scope.userCurrentEvent[name].y);
                    if ((this as SVGGeometryElement).isPointInFill(point)){
                        console.log(name);
                        eventList.push(scope.userCurrentEvent[name]);
                    }
                })
                scope.props.circleMouseOverFn(eventList);

            });

        // draw current dots
        var dots = graph.selectAll('.current-dot')
            .data(this.props.activeUsers)
            .enter()
            .append('g')
            .attr('class', 'current-dot')
            .attr('id', function(d, i){return d});
        dots.append('circle')
            .attr('r', 2)
            .attr('cx', function(d, i){return scalerX(userCurrentEvent[d].x);})
            .attr('cy', function(d, i){return scalerY(userCurrentEvent[d].y);})
            .attr('fill', function(d, i){return userCurrentEvent[d].passTest? 'green':'red';})

        // draw history dots
        var historyDots = graph.selectAll('.history-dot')
            .data(activeUsers)
            .enter()
            .append('g')
            .attr('class', 'history-dot')
            .attr('id', function(d, i){return d});
        historyDots.each(function(d, i){
            events[d].forEach((value: DLEvent, index: number) => {
                d3.select(this)
                    .append('circle')
                    .datum(value)
                    .attr('r', 2)
                    .attr('cx', function(d, i){return scalerX(d.x)})
                    .attr('cy', function(d, i){return scalerX(d.y)})
                    .attr('fill', function(d, i){return d.passTest? 'green':'red';})
                    .attr('opacity', '0%')
            })
        })

        // draw moving paths, this changes as events happen
        var paths = graph.selectAll('.path')
            .data(activeUsers)
            .enter()
            .append('g')
            .attr('class', 'path')
            .attr('id', function(d, i){return d;})
        paths.append("path")
            .style('stroke', 'gray')
            .style('stroke-width', '0.1')
            .style('fill', 'none')
            .attr('d', function(d, i){return d3Paths[d].toString();})

    }

    private calculateNode(node: MyNode){
        if (node.leftChild!.count===0){
            node.x = node.rightChild!.x;
            node.y = node.rightChild!.y;
            node.radius = node.rightChild!.radius;
        }

        else if(node.rightChild!.count===0){
            node.x = node.leftChild!.x;
            node.y = node.leftChild!.y;
            node.radius = node.leftChild!.radius;
        }

        else{
            var leftX = node.leftChild!.x;
            var leftY = node.leftChild!.y;
            var rightX = node.rightChild!.x;
            var rightY = node.rightChild!.y;
    
            var deltaX = leftX-rightX;
            var deltaY = leftY-rightY;
    
            var d = Math.sqrt(deltaX*deltaX+deltaY*deltaY);
            var rLeft = node.leftChild!.radius;
            var rRight = node.rightChild!.radius;
    
    
            node.x = d===0? leftX: (leftX*(d-rRight+rLeft)+rightX*(rRight-rLeft+d))/(2*d),
            node.y = d===0? leftY: (leftY*(d-rRight+rLeft)+rightY*(rRight-rLeft+d))/(2*d),
            node.radius = (d+rLeft+rRight)/2;    
        }
    }

    componentDidMount(){
        this.initGroup();
    }


    render(): React.ReactNode {
        return <svg id='2d-viz-canvas' className='viz-canvas'></svg>
    }
}

export {PlotViz};