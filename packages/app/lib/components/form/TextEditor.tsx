import React, { useEffect, useRef } from 'react'; React;
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

import { Plugin } from 'prosemirror-state';
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';

const menuPlugin = new Plugin({
  view(editorView) {
    let menuDiv = document.createElement('div');
    editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);

    const update = () => {
      ReactDOM.render(
        <MenuView editorView={editorView} />,
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


export const TextEditor = ({ setEditorView, state }) => {
  console.log("L0151/Editor() state=" + JSON.stringify(state, null, 2));
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const plugins = [
      history(),
      keymap({"Mod-z": undo, "Mod-y": redo}),
      keymap(baseKeymap),
      menuPlugin,
    ];
    const { doc } = state.data;
    console.log("TextEditor() doc=" + JSON.stringify(doc, null, 2));
    const editorState = (
      doc &&
        EditorState.fromJSON({
          schema,
          plugins,
        }, doc) ||
        EditorState.create({
          schema,
          plugins,
        })
    );
    const editorView = new EditorView(editorRef.current, {
      state: editorState,
      dispatchTransaction(transaction) {
        console.log("L0151/Editor() transaction=" + JSON.stringify(transaction, null, 2));
        const newState = editorView.state.apply(transaction);
        console.log("L0151/Editor() json=" + JSON.stringify(newState.doc.toJSON(), null, 2));
        state.apply({
          type: "update",
          args: {
            doc: newState.doc.toJSON(),
          },
        });
        editorView.updateState(newState);
      }
    });

    setEditorView(editorView);

    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div
        ref={editorRef}
        style={{
          border: '1px solid #ccc',
          padding: '8px',
          background: '#fff',
          color: '#333',
          fontFamily: 'Arial, sans-serif'
        }}
      />
    </div>
  );
};
