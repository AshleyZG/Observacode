// import { VDomRenderer, VDomModel, UseSignal } from '@jupyterlab/apputils';
import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
// import { CodeBlock } from "react-code-blocks";

import React from 'react';


class SolutionViewModel extends VDomModel {

    solutions: Map<string, string> = new Map();
    outputs: Map<string, any[]> = new Map();
    activeUsers: string[] = [];
    displayAll: boolean;

    constructor(displayAll: boolean = false){
        super();
        this.displayAll = displayAll;
    }

    setSolution(name:string, solution: string, masterCopy: string){
        if (this.solutions.has(name) && solution!==this.solutions.get(name)){
            if (!this.activeUsers.includes(name)){
                this.activeUsers.push(name);
            }
            this.solutions.set(name, solution);
            this.stateChanged.emit();    
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
        }
    }

    setOutput(name: string, outputs: any[]){
        this.outputs.set(name, outputs);
        this.stateChanged.emit();
    }
}


class SolutionViewWidget extends VDomRenderer<SolutionViewModel> {


    constructor(model: SolutionViewModel) {
        super(model);
        this.addClass('jp-ReactWidget');
        this.addClass('sideview');


    }

    render(): any {
        return <div></div>
        // return <div> 
        //     <UseSignal signal={this.model.stateChanged} >
        //         {(): JSX.Element => {
        //             return <div>
        //                 {
        //                     this.model.activeUsers.map((name) => {
        //                         return <div>
        //                             <div className='name-label'>
        //                                 <span>{name}</span>
        //                             </div>
        //                             <CodeBlock
        //                             text={this.model.solutions.get(name)}
        //                             language={"python"}
        //                             showLineNumbers={false}
        //                             />
        //                             <div  className='output'>
        //                                 <span>{this.model.outputs.get(name)?.slice(-1)[0]}</span>
        //                             </div>
        //                         </div>

        //                     })
        //                 }
        //             </div>
        //         }}
        //     </UseSignal>

        // </div> 

    }
}



export {SolutionViewWidget, SolutionViewModel};