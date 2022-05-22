import {
    JupyterFrontEnd,
    ILayoutRestorer,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
    NotebookPanel,
    INotebookModel,
  } from '@jupyterlab/notebook';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { CodeCell } from '@jupyterlab/cells';
import {
    ICommandPalette,
  } from '@jupyterlab/apputils';
import { 
	IObservableJSON, 
	IObservableMap, 
 } from '@jupyterlab/observables';
 import {
    ReadonlyPartialJSONValue
} from '@lumino/coreutils';
import { ICurrentUser } from '@jupyterlab/user';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { v4 as uuid } from 'uuid';

import {CellTypeSwitcher} from './cellTypeButton';


function newOnMetadataChanged (panel: NotebookPanel, cell: CodeCell, user: ICurrentUser){
	function fn (
		model: IObservableJSON,
		args: IObservableMap.IChangedArgs<ReadonlyPartialJSONValue | undefined>
	): void{
		switch (args.key) {
		case 'nbranch':
            for (var cell of panel.content.widgets){
                console.log(cell);
                if (cell.model.metadata.has('owner') && cell.model.metadata.get('owner')!==(user as any).name){
                    cell.node.style.display = 'none';
                }
            }
			break;
		default:
			break;
		}

	}
	return fn
}
console.log(newOnMetadataChanged);

class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    user: ICurrentUser;
    constructor(user: ICurrentUser){
        this.user = user;
    }
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {

        const dropdownButton = new CellTypeSwitcher(widget.content);

        widget.toolbar.insertItem(10, 'type', dropdownButton);
        return new DisposableDelegate(() => {
            dropdownButton.dispose();
        }) 
    }
}

const plugintest: JupyterFrontEndPlugin<void> = {
    id: 'ovservacode:test-plugin',
    autoStart: true,
    requires: [ICurrentUser, ICommandPalette, IRenderMimeRegistry, ILayoutRestorer],
    activate: activatePluginTest
}
  

function saveExercise(app: JupyterFrontEnd){
    function fn(){
        console.log('save exercise fn');
        const {shell} = app;
        const nbPanel = shell.currentWidget as NotebookPanel;


        if (nbPanel.model?.metadata.has('exerciseID')){
            alert("Exercise ID already exists");
        }
        else{
            var exerciseName = prompt("Please enter exercise name");
            if (exerciseName===null){
                alert("Exercise name can not be empty");
            }else{
                // assign uuid to this notebook
                nbPanel.model?.metadata.set('exerciseID', uuid());
                nbPanel.model?.metadata.set('exerciseName', exerciseName);
                console.log(nbPanel.model?.metadata);
            }
        }
    }
    return fn;
}

function clearExercise(app: JupyterFrontEnd){
    function fn(){
        console.log('clear exercise fn');
        const {shell} = app;
        const nbPanel = shell.currentWidget as NotebookPanel;
        nbPanel.model?.metadata.delete('exerciseID');
        console.log(nbPanel.model?.metadata);
    }
    return fn;
}

function activatePluginTest(
    app: JupyterFrontEnd,
    user: ICurrentUser,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    restorer: ILayoutRestorer    
): void {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(user));
    const {commands} = app;
    commands.addCommand('observacode/save-exercise:save', {
        execute: saveExercise(app),
        label: 'Save Exercise'
    })
    commands.addCommand('observacode/save-exercise:clear', {
        execute: clearExercise(app),
        label: 'Clear Exercise'
    })

    palette.addItem({
        command: 'observacode/save-exercise:save',
        category: 'Settings'
    })

}
  
export default plugintest;