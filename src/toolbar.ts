import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
    NotebookActions,
    NotebookPanel,
    INotebookModel,
  } from '@jupyterlab/notebook';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { CodeCell } from '@jupyterlab/cells';

import { 
	IObservableJSON, 
	IObservableMap, 
 } from '@jupyterlab/observables';
 import {
    ReadonlyPartialJSONValue
} from '@lumino/coreutils';
import { ICurrentUser } from '@jupyterlab/user';

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

        const callback = () => {

            // set activecell
            var activeCell = widget.content.activeCell;
            var previousCell;
            var branchID =  1;
            if (activeCell?.model.metadata.has('nbranch')){
                branchID = (activeCell.model.metadata.get('nbranch') as number) +1;
            }
            activeCell?.model.metadata.changed.connect(newOnMetadataChanged(widget, activeCell as CodeCell, this.user));
            previousCell = activeCell;

            // create a new cell below
            NotebookActions.insertBelow(widget.content);
            activeCell = widget.content.activeCell;
            activeCell?.model.sharedModel.setSource(`%%copy_space branch branch${branchID}`)
            activeCell?.model.metadata.set('branchID', branchID);
            activeCell?.model.metadata.set('owner', (this.user as any).name);
            
            previousCell?.model.metadata.set('nbranch', branchID);


        }

        const button = new ToolbarButton({
            className: 'branch-button',
            label: 'Create A New Branch',
            onClick: callback,
            tooltip: 'Create a new branch'
        })

        widget.toolbar.insertItem(10, 'branch', button);
        return new DisposableDelegate(() => {
            button.dispose();
        }) 
    }
}

class SeeAllButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {
        const callback = () => {
            for (var cell of widget.content.widgets){
                cell.node.style.removeProperty('display');
            }

        }
        const button = new ToolbarButton({
            className: 'seeall-button',
            label: 'See All Branches',
            onClick: callback,
            tooltip: 'See All Branches'
        })

        widget.toolbar.insertItem(11, 'seeall', button);
        return new DisposableDelegate(() => {
            button.dispose();
        })
    }
}


const plugintest: JupyterFrontEndPlugin<void> = {
    id: 'ovservacode:test-plugin',
    autoStart: true,
    requires: [ICurrentUser],
    activate: activatePluginTest
}
  
function activatePluginTest(
    app: JupyterFrontEnd,
    user: ICurrentUser
): void {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(user));
    app.docRegistry.addWidgetExtension('Notebook', new SeeAllButtonExtension());
}
  
export default plugintest;