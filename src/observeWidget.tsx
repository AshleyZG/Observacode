import { VDomRenderer, VDomModel, UseSignal } from '@jupyterlab/apputils';

import React from 'react';
import { TimeLine, historyEvent, typingActivity } from './timelineWidget';
import { ClusterWidget, ErrorMessage, OverCodeCluster, OverCodeClusterWidget, MyTag } from './clusterWidget';
import { ConfigPanel } from './configWidget';
import { requestAPI } from './handler';

class ObserveViewModel extends VDomModel {

    solutions: Map<string, string> = new Map();
    outputs: Map<string, any[]> = new Map();
    activeUsers: string[] = [];
    queryFilter: {[name: string]: number} = {}
    displayAll: boolean;
    events: Map<string, historyEvent[]> = new Map();
    typingActivities: Map<string, typingActivity[]> = new Map();
    startTime: Map<string, number> = new Map();
    nAccEdits: Map<string, number> = new Map();
    lastCommitEdits: Map<string, number> = new Map();
    eMessages: {[errorType: string]: ErrorMessage[]} = {};
    typingStatus: Map<string, boolean> = new Map();
    typingActivityMode: boolean = false;
    overCodeClusters: {[cluster_id: number]: OverCodeCluster} = {};
    overCodeCandidates: {[name: string]: string[]} = {};
    overCodeResults: {[key:string]: number} = {};
    rawOverCodeResults: any[] = [];
    clusterIDs: number[] = [];

    constructor(displayAll: boolean = false){
        super();
        this.displayAll = displayAll;
        this.setOverCodeResult();
    }

    setOverCodeResult(){
        requestAPI<any>('get_overcode_results')
        .then(data => {
            console.log(data);
            var overcode_result = data.data;
            this.rawOverCodeResults = data.data;
            for (const cluster of overcode_result){
                var cluster_id = cluster.id;
                for (const member of cluster.members){
                    this.overCodeResults[member] = cluster_id;
                }
            }
            this.stateChanged.emit();
        })
        .catch(reason => {
            console.error(
                `The observacode server extension appears to be missing.\n${reason}`
            );
        });

    }

    setTypingActivityMode(){
        this.typingActivityMode = this.typingActivityMode? false: true;
        this.stateChanged.emit();
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
                this.queryFilter[name] = 0;
                this.stateChanged.emit();    
            }
            this.solutions.set(name, solution);
        }
        else{
            if (this.displayAll){
                if (!this.activeUsers.includes(name)){
                    this.activeUsers.push(name);
                    this.queryFilter[name] = 0;

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
        this.addTypingActivity(name);
        setTimeout(()=>{this.typingStatus.set(name, false)}, 5000);
    }


    setOutput(name: string, outputs: any[]){
        this.outputs.set(name, outputs);
        if (outputs.length>0){
            this.addEvent(name);
        }
        // this.stateChanged.emit();
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

    addTypingActivity(name: string){
        const activity = {
            timestamp: Date.now() - this.startTime.get(name)!
        }

        if (!this.typingActivities.has(name)){
            this.typingActivities.set(name, [])
        }
        this.typingActivities.get(name)?.push(activity);
    }

    addEvent(
        name: string,
    ){

        const output = this.outputs.get(name)?.slice(-1)[0];
        const emessage = output.output;
        const correct = output.passTest;

        const event: historyEvent = {
            value: this.solutions.get(name)!,
            radius: this.nAccEdits.get(name)!-this.lastCommitEdits.get(name)!+1,
            startTime: Date.now() - this.startTime.get(name)!,
            correct: correct,
            tooltip: this.solutions.get(name)!,
            eMessage: emessage,
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
                code: this.solutions.get(name)!,
                name: name,
                submissionIndex: this.outputs.get(name)!.length-1,
            })
            event.errorType = errorType;
        }else{
            if (! (name in this.overCodeCandidates)){
                this.overCodeCandidates[name] = [];
            }
            this.overCodeCandidates[name].push(this.solutions.get(name)!);
            this.updateOverCodeResults(name);
        }

        if (!this.events.has(name)){
            this.events.set(name, [])
        }
        this.events.get(name)?.push(event);
        this.stateChanged.emit();
    }

    updateOverCodeResults(name: string){

        var idx = this.overCodeCandidates[name].length-1;
        var new_name = name.split('@')[0];
        var key = new_name+'_'+idx;
        var cluster_id = this.overCodeResults[key];

        if (this.rawOverCodeResults[cluster_id-1].correct && !(this.clusterIDs.includes(cluster_id))){
            this.clusterIDs.push(cluster_id);
        }else if(!(this.clusterIDs.includes(-1))){
            this.clusterIDs.push(-1);
        }


        if (this.rawOverCodeResults[cluster_id-1].correct && ! (cluster_id in this.overCodeClusters)){
            this.overCodeClusters[cluster_id] = {
                id: cluster_id,
                correct: this.rawOverCodeResults[cluster_id-1].correct,
                count: 0,
                members: [],
                names: [],
            }
        }else if (! (-1 in this.overCodeClusters)){
            this.overCodeClusters[-1] = {
                id: -1,
                correct: this.rawOverCodeResults[cluster_id-1].correct,
                count: 0,
                members: [],
                names: [],
            }
        }
        // debugger;
        if (this.rawOverCodeResults[cluster_id-1].correct){
            this.overCodeClusters[cluster_id].members.push(this.overCodeCandidates[name][idx]);
            this.overCodeClusters[cluster_id].names.push(name);
            this.overCodeClusters[cluster_id].count+=1;    
        }else{
            this.overCodeClusters[-1].members.push(this.overCodeCandidates[name][idx]);
            this.overCodeClusters[-1].names.push(name);
            this.overCodeClusters[-1].count+=1;    

        }
  
        this.stateChanged.emit();
    }

    setTimelineFocus(){
        var scope = this;
        function fn(event: React.MouseEvent){
            var targetBlock = event.currentTarget.parentElement?.parentElement!;
            var index = parseInt(targetBlock.getAttribute('data-index') as string);
    
            var name: string | undefined;
    
            if (targetBlock.classList.contains('error')){
                var errorType = targetBlock.getAttribute('data-title') as string;
                name = scope.eMessages[errorType][index].name;
            }else if (targetBlock.classList.contains('overcode')){
                var cluster_id = parseInt((targetBlock.getAttribute('data-title') as string).split(' ').slice(-1)[0]);
                name = scope.overCodeClusters[cluster_id].names[index];
            }
            var targetLine = document.getElementById(name!);
            targetLine?.classList.add('focus');
            setTimeout(()=>{targetLine?.classList.remove('focus')}, 5000)
        }
        return fn;
    }


    queryUserNames(query: string){
        var names: string[];
        if (query.startsWith('cluster')){
            var cluster_id = parseInt(query.split(' ').slice(-1)[0]);
            names = [...new Set(this.overCodeClusters[cluster_id].names)];
        }else{
            var errorType = query;
            names = [...new Set(this.eMessages[errorType].map((value)=> {return value.name}))];
        }
        return names;
    }

    addQuery(query: string){
        var names = this.queryUserNames(query);
        for (const value of names){
            this.queryFilter[value]+=1;
        }
        this.activeUsers = this.activeUsers.sort((a, b) => {
            return this.queryFilter[b]-this.queryFilter[a];
        })
        this.stateChanged.emit();
    }

    removeQuery(query: string){
        var names = this.queryUserNames(query);

        for (const value of names){
            this.queryFilter[value]-=1;
        }
        this.activeUsers = this.activeUsers.sort((a, b) => {
            return this.queryFilter[b]-this.queryFilter[a];
        })
        this.stateChanged.emit();
    }


}


class ObserveViewWidget extends VDomRenderer<ObserveViewModel> {


    constructor(model: ObserveViewModel) {
        super(model);
        this.addClass('jp-ReactWidget');
        this.addClass('sideview');
    }

    setTypingActivityMode(){
        var scope = this;
        function fn(){
            scope.model.setTypingActivityMode();            
        }
        return fn;
    }

    tagOnClick(){
        var scope = this;
        function fn(event: React.MouseEvent){
            console.log(event.currentTarget);
            var target = event.currentTarget;
            if (target.classList.contains('selected')){
                target.classList.remove('selected');
                scope.model.removeQuery(target.getAttribute('data-value') as string);
            }else{
                target.classList.add('selected');
                scope.model.addQuery(target.getAttribute('data-value') as string);
            }
        }
        return fn;
    }

    render(): any {
        const errorTypes = Object.keys(this.model.eMessages);
        return <div> 
            <UseSignal signal={this.model.stateChanged} >
                {(): any => {
                    return <div>
                        {/* Configuration panel */}
                        <div className='configuration'>
                            <ConfigPanel
                                typingActivityMode={this.model.typingActivityMode}
                                setTypingActivityMode={this.setTypingActivityMode()}
                            />
                        </div>
                        {/* Timeline view */}
                        <div className='timeline' id='left-panel'>
                            <TimeLine
                                width={800}
                                height={4000}
                                lanes={this.model.activeUsers}
                                queryFilter={this.model.queryFilter}
                                events={this.model.events}
                                typingActivities={this.model.typingActivities}
                                typingStatus={this.model.typingStatus}
                                tooltipMode={true}
                                typingActivityMode={this.model.typingActivityMode}
                                dotOnClick={()=> {}}
                                dotOnDragStart={()=> {}}
                                dotOnHover={()=> {}}
                            />
                        </div>
                        <div id='right-panel'>
                            <div>
                                {errorTypes.map((value) => {
                                    return <MyTag
                                        value={value}
                                        count={this.model.eMessages[value].length}
                                        onClick={this.tagOnClick()}
                                    />
                                })}
                                {this.model.clusterIDs.map((cluster_id: number) => {
                                    return <MyTag
                                        value={`cluster ${cluster_id}`}
                                        count={this.model.overCodeClusters[cluster_id].count}
                                        onClick={this.tagOnClick()}
                                    />
                                })}
                            </div>
                            <div>
                                {/* Error view */}
                                {
                                    errorTypes.map((value) => {
                                        return <ClusterWidget
                                        errorType={value}
                                        errorMessages={this.model.eMessages[value]}
                                        events={this.model.events}
                                        timelineButtonFn={this.model.setTimelineFocus()}
                                        />
                                    })
                                }
                                {/* OverCode cluster view */}
                                {
                                    this.model.clusterIDs.map((cluster_id: number) => {
                                        return <OverCodeClusterWidget
                                        cluster_id={cluster_id}
                                        cluster={this.model.overCodeClusters[cluster_id]}  
                                        timelineButtonFn={this.model.setTimelineFocus()}
                                        />
                                    })
                                }

                            </div>

                        </div>
                        <div>
                        </div>
                    </div>
                }}
            </UseSignal>
        </div> 
    }
}



export {ObserveViewWidget, ObserveViewModel};