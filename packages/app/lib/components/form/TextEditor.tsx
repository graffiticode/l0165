import React, { useEffect, useRef } from 'react'; React;
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

export const TextEditor = ({ setEditorView, state }) => {
  console.log("L0151/Editor() state=" + JSON.stringify(state, null, 2));
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const plugins = [
      history(),
      keymap({"Mod-z": undo, "Mod-y": redo}),
      keymap(baseKeymap),
    ];
    const { doc } = state.data;
    const editorState = doc &&
          EditorState.fromJSON({
            schema,
            plugins,
          }, state.data) ||
          EditorState.create({
            schema,
            plugins,
          });

    editorViewRef.current = new EditorView(editorRef.current, {
      state: editorState,
      dispatchTransaction(transaction) {
        console.log("L0151/Editor() transaction=" + JSON.stringify(transaction, null, 2));
        const newState = editorViewRef.current.state.apply(transaction);
        console.log("L0151/Editor() json=" + JSON.stringify(newState.doc.toJSON(), null, 2));
        state.apply({
          type: "update",
          args: {
            doc: newState.doc.toJSON(),
          },
        });
        editorViewRef.current.updateState(newState);
      }
    });

    setEditorView(editorViewRef.current);

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
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
