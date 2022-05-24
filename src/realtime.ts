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
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YCodeCell } from '@jupyterlab/shared-models'; 


class ButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>{
    createNew(widget: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): void | IDisposable {

        function callback(){
            const ydoc = new Y.Doc();
            const source = ydoc.getText('mysource');
            const websocketProvider = new WebsocketProvider(
                'ws://localhost:1234', 'count-demo', ydoc
            );
            (widget.model?.sharedModel.getCell(2) as YCodeCell).setSource("");
            (widget.model!.sharedModel.getCell(2) as YCodeCell).ysource.applyDelta(source.toDelta());

            source.observe(event => {
                (widget.model!.sharedModel.getCell(2) as YCodeCell).ysource.applyDelta(event.delta);
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