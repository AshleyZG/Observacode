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
import {
    ICommandPalette,
  } from '@jupyterlab/apputils';
import { ICurrentUser } from '@jupyterlab/user';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { ToolbarButton } from '@jupyterlab/apputils';
import { DLViewModel, DLViewWidget } from './dlViewWidget';
import { requestAPI } from './handler';
import { DLEvent } from './dlViewWidget';

class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {

        function callback(){
            var events: {[name: string]: DLEvent[]} = {};
            // var treeData: number[][] = [];
            var distanceData: number[] = [];
            // load data from server end
            requestAPI<any>('get_dl_view_results')
            .then(data => {
                events = data.events;
                // treeData = data.tree;
                distanceData = data.distance;

                console.log(distanceData);

                const keySolutionWidgetMap = new Map<string, DLViewWidget>();
    
                widget.content.widgets.forEach((cell, index) => {
    
                    var solutionViewModel = new DLViewModel(events);
                    var solutionViewWidget = new DLViewWidget(solutionViewModel);
    
                    keySolutionWidgetMap.set(cell.model.metadata.get('cellID') as string, solutionViewWidget);
    
                    (cell.layout as any).addWidget(solutionViewWidget);
                })
     
                const keyCellMap = new Map<string, number>();
    
                widget.content.widgets.forEach((cell, index) => {
                    keyCellMap.set(cell.model.metadata.get('cellID') as string, index);
                })
    

            })
            .catch(reason => {
                console.error(
                    `The observacode server extension appears to be missing.\n${reason}`
                );
            });

        }
        const button = new ToolbarButton({
            className: 'observe-button',
            label: 'Deep Learning View',
            onClick: callback,
            tooltip: `Observe students' progress in 2d view`
        });

        widget.toolbar.insertItem(13, 'dlbutton', button);
        return new DisposableDelegate(() => {
            button.dispose();
          });
    }
}

const pluginDLView: JupyterFrontEndPlugin<void> = {
    id: 'ovservacode:dl-plugin',
    autoStart: true,
    requires: [ICurrentUser, ICommandPalette, IRenderMimeRegistry, ILayoutRestorer],
    activate: activatePlugin
}
  


function activatePlugin(
    app: JupyterFrontEnd,
    user: ICurrentUser,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    restorer: ILayoutRestorer    
): void {
    
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());

}
  
export default pluginDLView;