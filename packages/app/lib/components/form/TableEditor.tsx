import React, { useState, useEffect, useRef } from 'react'; React;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
//import '../style/tables.css';
import "prosemirror-tables/style/tables.css";

import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
// import { DOMParser, Schema } from 'prosemirror-model';
import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { keymap } from 'prosemirror-keymap';
// import { exampleSetup, buildMenuItems } from 'prosemirror-example-setup';
// import { MenuItem, Dropdown } from 'prosemirror-menu';

import {
//   addColumnAfter,
//   addColumnBefore,
//   deleteColumn,
//   addRowAfter,
//   addRowBefore,
//   deleteRow,
//   mergeCells,
//   splitCell,
//   setCellAttr,
//   toggleHeaderRow,
//   toggleHeaderColumn,
//   toggleHeaderCell,
  goToNextCell,
//   deleteTable,
} from "prosemirror-tables";
import { tableEditing, columnResizing, tableNodes, fixTables } from "prosemirror-tables";

// import { EditorState } from 'prosemirror-state';
// import { EditorView } from 'prosemirror-view';
// import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
// import { keymap } from "prosemirror-keymap";

import { Plugin } from 'prosemirror-state';
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

const menuPlugin = new Plugin({
  view(editorView) {
    let menuDiv = document.createElement('div');
    editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);
    const update = () => {
      ReactDOM.render(
        <MenuView className="" editorView={editorView} />,
        menuDiv
      );
    };
    update();
    return {
      update,
      destroy() {
        ReactDOM.unmountComponentAtNode(menuDiv);
        menuDiv.remove();
      }
    };
  }
});

const debouncedStateUpdate = debounce(({ state, editorState }) => {
  state.apply({
    type: "update",
    args: {editorState},
  });
}, 1000);

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
          },
        },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

const plugins = [
  columnResizing(),
  tableEditing(),
  history(),
  keymap({"Mod-z": undo, "Mod-y": redo}),
  keymap({
    ...baseKeymap,
    Tab: goToNextCell(1),
    'Shift-Tab': goToNextCell(-1),
  }),
  menuPlugin,
];

let initEditorState = EditorState.create({
//  doc,
  schema,
  plugins,
    // .concat(
    //   exampleSetup({
    //     schema,
    //     menuContent: menu,
    //   }),
    // ),
});
const fix = fixTables(initEditorState);
if (fix) initEditorState = initEditorState.apply(fix.setMeta('addToHistory', false));

export const TableEditor = ({ state }) => {
  const [ editorView, setEditorView ] = useState(null);
  const editorRef = useRef(null);
  // const plugins = [
  //   history(),
  //   keymap({"Mod-z": undo, "Mod-y": redo}),
  //   keymap(baseKeymap),
  //   menuPlugin,
  // ];
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const editorView = new EditorView(editorRef.current, {
      state: initEditorState,
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        debouncedStateUpdate({
          state,
          editorState: editorState.toJSON()
        });
      }
    });
    setEditorView(editorView);
    editorView.focus();
    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  const { editorState } = state.data;
  useEffect(() => {
    if (editorView && editorState) {
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorState);
      editorView.updateState(newEditorState);
    }
  }, [editorView, editorState]);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white font-sans"
    />
  );
};
