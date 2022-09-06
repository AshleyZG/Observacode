import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';
import plugintest from './toolbar';
import pluginShare from './realtime';
import pluginObserveCode from './observeCode';
import pluginDLView from './dlView';
import pluginScatterView from './scatterView';

/**
 * Initialization data for the observacode extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'observacode:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension observacode is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The observacode server extension appears to be missing.\n${reason}`
        );
      });
  }
};


export default [plugin, plugintest, pluginShare, pluginObserveCode, pluginDLView, pluginScatterView];
// export {plugin, plugintest};
