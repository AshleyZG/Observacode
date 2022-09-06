import { VDomRenderer, VDomModel, UseSignal } from '@jupyterlab/apputils';
import React from 'react';

import { PlotViz, Position } from './2dViz';
import SyntaxHighlighter from 'react-syntax-highlighter';

export interface DLEvent{
    code: string,
    output: string,
    passTest: boolean,
    target: string,
    timeOffset: number,
    type: string,
    x: number,
    y: number,
    treeid: number,
}

export interface MyNode{
    id: number,
    leftChild: MyNode | null,
    rightChild: MyNode | null,
    parent: MyNode | null,
    count: number,
    leafIDs: number[],
    x: number,
    y: number,
    radius: number,
    distance: number | null,
    code?: string,
}


class DLViewModel extends VDomModel {

    activeUsers: string[] = [];
    currentPosition: {[name: string]: Position} = {};
    events: {[name: string]: DLEvent[]} = {};
    treeNodes: {[key: number]: MyNode} = {};
    rootNode: MyNode | undefined;
    leafEvents: {[key: number]: DLEvent} = {};
    nSample: number | undefined;
    minX: number = Infinity;
    minY: number = Infinity;
    maxX: number = -Infinity;
    maxY: number = -Infinity;

    // selectedLeafIDs: number[] = [];
    selectedEvents: DLEvent[] = [];

    constructor(events: {[name: string]: DLEvent[]}){
        super();
        this.loadEvents(events);
    }

    loadEvents(events: {[name: string]: DLEvent[]}){
        // init variables
        var n_samples = 0;

        // set events
        this.events = events;

        // set minX, minY, maxX, maxY, nSample
        for (let name in events){
            events[name].forEach((event: DLEvent) => {
                this.minX = event.x<this.minX? event.x : this.minX;
                this.minY = event.y<this.minY? event.y : this.minY;
                this.maxX = event.x>this.maxX? event.x : this.maxX;
                this.maxY = event.y>this.maxY? event.y : this.maxY;
                n_samples += 1;
                this.treeNodes[event.treeid] = {
                    id: event.treeid,
                    leftChild: null,
                    rightChild: null,
                    parent: null,
                    count: 1,
                    leafIDs: [event.treeid],
                    x: event.x,
                    y: event.y,   
                    distance: null,
                    radius: 5,
                    code: event.code,   
                }
                this.leafEvents[event.treeid] = event;
            })
            this.activeUsers.push(name);
        }
        this.nSample = n_samples;

    }

    circleMouseOver(){
        const scope = this;
        function fn(eventList: DLEvent[]){
            // scope.selectedLeafIDs = leafIDs;
            scope.selectedEvents = eventList;
            scope.stateChanged.emit();
        }
        return fn;
    }


}


class DLViewWidget extends VDomRenderer<DLViewModel> {

    ref: SVGSVGElement|undefined;

    constructor(model: DLViewModel) {
        super(model);
    }


    circleMouseOut(){

    }

    render(): any {
        return <div> 
            <UseSignal signal={this.model.stateChanged} >
                {(): any => {
                    return <div>
                        <div className='dl-view' id='two-d-viz'>
                            <PlotViz 
                                activeUsers={this.model.activeUsers}
                                events={this.model.events}
                                treeNodes={this.model.treeNodes}
                                rootNode={this.model.rootNode!}
                                leafEvents={this.model.leafEvents}
                                nSample={this.model.nSample!}
                                minX={this.model.minX}
                                minY={this.model.minY}
                                maxX={this.model.maxX}
                                maxY={this.model.maxY}
                                width={1200}
                                height={800}
                                radius={8}
                                interval={1500}
                                maxNumber={10}
                                maxDistance={10}
                                circleMouseOverFn={this.model.circleMouseOver()}
                                circleMouseOutFn={this.circleMouseOut}
                            ></PlotViz>
                        </div>
                        <div id='code-view'>
                            {this.model.selectedEvents.map((event: DLEvent) => {
                                return <div>
                                    <SyntaxHighlighter language='python' >{event.code}</SyntaxHighlighter>
                                    </div>
                            })}
                        </div>
                    </div>
                }}
            </UseSignal>
        </div> 
    }
}

export {DLViewWidget, DLViewModel};