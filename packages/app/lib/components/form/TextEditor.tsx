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

export const TextEditor = ({ state }) => {
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
        const newState = editorView.state.apply(transaction);
        state.apply({
          type: "update",
          args: {
            doc: newState.doc.toJSON(),
          },
        });
        editorView.updateState(newState);
      }
    });
    editorView.focus();
    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white font-sans"
    />
  );
};
