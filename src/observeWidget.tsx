import { VDomRenderer, VDomModel, UseSignal } from '@jupyterlab/apputils';

import React from 'react';
// import { validate } from 'uuid';
import { TimeLine, historyEvent } from './timelineWidget';
import { ClusterWidget } from './clusterWidget';

class ObserveViewModel extends VDomModel {

    solutions: Map<string, string> = new Map();
    outputs: Map<string, any[]> = new Map();
    activeUsers: string[] = [];
    displayAll: boolean;
    events: Map<string, historyEvent[]> = new Map();
    startTime: Map<string, number> = new Map();
    nAccEdits: Map<string, number> = new Map();
    lastCommitEdits: Map<string, number> = new Map();
    eMessages: {[errorType: string]: any[]} = {}
    typingStatus: Map<string, boolean> = new Map();

    constructor(displayAll: boolean = false){
        super();
        this.displayAll = displayAll;
    }

    setSolution(name:string, solution: string, masterCopy: string){

        if (!this.nAccEdits.has(name)){
            this.nAccEdits.set(name, 0);
            this.lastCommitEdits.set(name, 0);
        }
        this.nAccEdits.set(name, this.nAccEdits.get(name)!+1);

        if (this.solutions.has(name) && solution!==this.solutions.get(name)){
            if (!this.activeUsers.includes(name)){
                this.activeUsers.push(name);
                this.stateChanged.emit();    
            }
            this.solutions.set(name, solution);
        }
        else{
            if (this.displayAll){
                if (!this.activeUsers.includes(name)){
                    this.activeUsers.push(name);
                }
                this.solutions.set(name, solution);
                this.stateChanged.emit();      
            }        
            else{
                this.solutions.set(name, solution);    
            }
            this.startTime.set(name, Date.now());
        }
        this.typingStatus.set(name, true);
        setTimeout(()=>{this.typingStatus.set(name, false)}, 5000);
    }

    setTypingStatus(name: string, value: boolean){
        const oldValue = this.typingStatus.get(name);
        if (oldValue!==value){
            this.typingStatus.set(name, value);
            this.stateChanged.emit();
        }
        
    }

    setOutput(name: string, outputs: any[]){
        this.outputs.set(name, outputs);
        if (outputs.length>0){
            this.addEvent(name);
        }
        this.stateChanged.emit();
    }

    parseErrorMessage(eMessage: string){
        var tokens = eMessage.split(' ');
        var errorType = tokens[0].slice(0, -1);
        var lineIndex: number;
        if (errorType==='IndentationError'){
            lineIndex = parseInt(tokens[11]);
        }else{
            lineIndex = parseInt(tokens.slice(-1)[0]);
        }
        return {errorType, lineIndex};
    }

    addEvent(
        name: string,
        // correct: boolean,
    ){

        const output = this.outputs.get(name)?.slice(-1)[0];
        const emessage = output.output;
        const correct = output.passTest;
        // const emessage = this.outputs.get(name)?.slice(-1)[0];

        const event: historyEvent = {
            value: this.solutions.get(name)!,
            radius: this.nAccEdits.get(name)!-this.lastCommitEdits.get(name)!+1,
            startTime: Date.now() - this.startTime.get(name)!,
            correct: correct,
            tooltip: this.solutions.get(name)!,
            eMessage: emessage,
            // passTest: passTest
        }
        
        // set last commit edit number
        this.lastCommitEdits.set(name, this.nAccEdits.get(name)!);

        // set error message
        if (emessage!=='success'){
            const {errorType, lineIndex} = this.parseErrorMessage(emessage);
            if (! (errorType in this.eMessages)){
                this.eMessages[errorType] = [];
            }
            this.eMessages[errorType].push({
                eMessage: emessage,
                eType: errorType,
                lineIndex: lineIndex,
                code: this.solutions.get(name)
            })

        }



        if (!this.events.has(name)){
            this.events.set(name, [])
        }
        this.events.get(name)?.push(event);
        this.stateChanged.emit();
    }
}


class ObserveViewWidget extends VDomRenderer<ObserveViewModel> {


    constructor(model: ObserveViewModel) {
        super(model);
        this.addClass('jp-ReactWidget');
        this.addClass('sideview');
    }

    render(): JSX.Element {
        const errorTypes = Object.keys(this.model.eMessages);
        return <div> 
            <UseSignal signal={this.model.stateChanged} >
                {(): JSX.Element => {
                    return <div>

                        <div className='timeline'>
                            <TimeLine
                                width={800}
                                height={8000}
                                lanes={this.model.activeUsers}
                                events={this.model.events}
                                typingStatus={this.model.typingStatus}
                                tooltipMode={true}
                                dotOnClick={()=> {}}
                                dotOnDragStart={()=> {}}
                                dotOnHover={()=> {}}
                            />
                        </div>
                        <div>
                            {
                                errorTypes.map((value) => {
                                    return <div>
                                        {/* <div>{value}</div> */}
                                        <ClusterWidget
                                            errorType={value}
                                            errorMessages={this.model.eMessages[value]}
                                        />
                                    </div>
                                })
                            }
                        </div>

                    </div>
                }}
            </UseSignal>
        </div> 
    }
}



export {ObserveViewWidget, ObserveViewModel};