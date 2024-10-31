import React, { useEffect, useRef } from 'react'; React;
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';

export const Editor = ({ state }) => {
  console.log("L0151/Editor() state=" + JSON.stringify(state, null, 2));
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const editorState = EditorState.create({schema});

    editorViewRef.current = new EditorView(editorRef.current, {
      state: editorState,
      dispatchTransaction(transaction) {
        const newState = editorViewRef.current.state.apply(transaction);
        editorViewRef.current.updateState(newState);
      }
    });

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, []);

  return (
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
  );
};
