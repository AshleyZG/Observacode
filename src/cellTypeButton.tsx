import { ReactWidget } from '@jupyterlab/apputils';
import {
    Notebook,
} from '@jupyterlab/notebook';
import { 
    HTMLSelect
} from '@jupyterlab/ui-components';
import {
    ITranslator,
    nullTranslator,
} from '@jupyterlab/translation';
import React from 'react';
import { v4 as uuid } from 'uuid';


const TOOLBAR_CELLTYPE_CLASS = 'jp-Notebook-toolbarCellType';


const TOOLBAR_CELLTYPE_DROPDOWN_CLASS = 'jp-Notebook-toolbarExerciseTypeDropdown';



/**
 * A toolbar widget that switches cell types.
 */
 export class CellTypeSwitcher extends ReactWidget {
    private _notebook: Notebook;
    private _trans;
    /**
     * Construct a new cell type switcher.
     */
    constructor(widget: Notebook, translator?: ITranslator) {
      super();
      this._trans = (translator || nullTranslator).load('jupyterlab');
      this.addClass(TOOLBAR_CELLTYPE_CLASS);
      this._notebook = widget;
      if (widget.model) {
        this.update();
      }
      widget.activeCellChanged.connect(this.update, this);
      // Follow a change in the selection.
      widget.selectionChanged.connect(this.update, this);
    }
  
  
    /**
     * Handle `change` events for the HTMLSelect component.
     */
    handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
      if (event.target.value !== '-') {
        for (const widget of this._notebook.widgets){
          if (this._notebook.isSelectedOrActive(widget)){
            widget.model.metadata.set('exerciseType', event.target.value);
            if (!widget.model.metadata.has('cellID')){
              widget.model.metadata.set('cellID', uuid());
            }
          }
        }
        console.log('new type', event.target.value)
        this._notebook.activate();
        this.update();
      }
    };
  
  
    /**
     * Handle `keydown` events for the HTMLSelect component.
     */
    handleKeyDown = (event: React.KeyboardEvent): void => {
      if (event.keyCode === 13) {
        this._notebook.activate();
      }
    };
  
  
    render(): JSX.Element {
      let value = '-';
      if (this._notebook.activeCell) {

        if (this._notebook.activeCell.model.metadata.has('exerciseType')){
          value = this._notebook.activeCell.model.metadata.get('exerciseType') as string;
          console.log(value);  
        }
      }
      for (const widget of this._notebook.widgets) {
        if (this._notebook.isSelectedOrActive(widget)) {
          if ((widget.model.metadata.get('exerciseType') as string)!==value){

            value = '-';
            break;
          }
        }
      }
      return (
        <HTMLSelect
          className={TOOLBAR_CELLTYPE_DROPDOWN_CLASS}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          value={value}
          aria-label={this._trans.__('Cell type')}
          title={this._trans.__('Select the cell type')}
        >
          <option value="-">-</option>
          <option value="description">{this._trans.__('Description')}</option>
          <option value="solution">{this._trans.__('Solution')}</option>
          <option value="test">{this._trans.__('Test')}</option>
        </HTMLSelect>
      );
    }

}