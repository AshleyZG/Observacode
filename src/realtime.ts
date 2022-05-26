import {
    JupyterFrontEnd,
    ILayoutRestorer,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
    NotebookPanel,
    INotebookModel,
    // NotebookActions,
  } from '@jupyterlab/notebook';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import {
    ICommandPalette,
  } from '@jupyterlab/apputils';
import { ICurrentUser } from '@jupyterlab/user';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { ToolbarButton } from '@jupyterlab/apputils';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YCodeCell } from '@jupyterlab/shared-models'; 


class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {

        function callback(){
            const ydoc = new Y.Doc();

            const websocketProvider = new WebsocketProvider(
                'ws://localhost:1234', 'count-demo', ydoc
            );
            websocketProvider.connect();

            const source = ydoc.getMap('shared');
            for (var cell of widget.content.widgets){
                cell.model.sharedModel.setSource("");
            }

            const keyCellMap = new Map<string, number>();

            ydoc.on('update', (update, origin, doc) => {
                console.log('todo');
                console.log(source.toJSON());

                for (const key of source.keys()){
                    console.log(key);
                    if (keyCellMap.has(key)){
                        console.log('todo');
                    }else{
                        console.log('todo');
                        keyCellMap.set(key, keyCellMap.size);
                        // make sure we have enough cells
                        if (widget.content.widgets.length<keyCellMap.size){
                            var newCell = YCodeCell.create();
                            widget.model?.sharedModel.insertCell(widget.content.widgets.length, newCell);
                        }
                    }
                    (widget.model?.sharedModel.getCell(keyCellMap.get(key)!) as YCodeCell).setSource((source.get(key) as Y.Text).toString());

                }

            })

            console.log(websocketProvider);

        }
        const button = new ToolbarButton({
            className: 'sharing-button',
            label: 'Real Time View',
            onClick: callback,
            tooltip: 'Start Sharing'
        });

        widget.toolbar.insertItem(11, 'realtimebutton', button);
        return new DisposableDelegate(() => {
            button.dispose();
          });
    }
}

const pluginShare: JupyterFrontEndPlugin<void> = {
    id: 'ovservacode:share-plugin',
    autoStart: true,
    requires: [ICurrentUser, ICommandPalette, IRenderMimeRegistry, ILayoutRestorer],
    activate: activatePluginTest
}
  


function activatePluginTest(
    app: JupyterFrontEnd,
    user: ICurrentUser,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    restorer: ILayoutRestorer    
): void {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());

}
  
export default pluginShare;