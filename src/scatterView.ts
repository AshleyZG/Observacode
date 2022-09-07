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
import { ScatterViewModel, ScatterViewWidget } from './scatterViewWidget';
import { DLEvent } from './scatterViewWidget';

var allEvents: any = {};

fetch('https://raw.githubusercontent.com/AshleyZG/VizProData/master/url-list.json')
    .then((response) => response.json())
    .then((responseJson) => {
        responseJson.forEach((url: string) => {
            fetch(url)
                .then((response) => response.json())
                .then((content) => {
                    var key = content[0]['sid']+'.json';
                    allEvents[key] = content;
                })
                .catch((error)=>{
                    console.log(error);
                })
        })
    })
    .then(()=>{
        console.log(allEvents);
    })
    .catch((error) => {
        console.error(error);
    })



class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {

        function callback(){
            var events: {[name: string]: DLEvent[]} = allEvents;
            console.log(events);

            const keySolutionWidgetMap = new Map<string, ScatterViewWidget>();
    
            widget.content.widgets.forEach((cell, index) => {

                var solutionViewModel = new ScatterViewModel(events);
                var solutionViewWidget = new ScatterViewWidget(solutionViewModel);

                keySolutionWidgetMap.set(cell.model.metadata.get('cellID') as string, solutionViewWidget);

                (cell.layout as any).addWidget(solutionViewWidget);
            })
 
            const keyCellMap = new Map<string, number>();

            widget.content.widgets.forEach((cell, index) => {
                keyCellMap.set(cell.model.metadata.get('cellID') as string, index);
            })

        }
        const button = new ToolbarButton({
            className: 'observe-button',
            label: 'Scatter Plot View',
            onClick: callback,
            tooltip: `Scatter plot view`
        });

        widget.toolbar.insertItem(14, 'scatterbutton', button);
        return new DisposableDelegate(() => {
            button.dispose();
          });
    }
}

const pluginScatterView: JupyterFrontEndPlugin<void> = {
    id: 'ovservacode:scatter-plugin',
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
  
export default pluginScatterView;