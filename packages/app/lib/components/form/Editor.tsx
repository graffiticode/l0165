import React from "react"; React;
import { useState } from "react";
import { MenuView } from "./MenuView";
import { TextEditor } from "./TextEditor";

export const Editor = ({ state }) => {
  console.log("L0151/Editor() state=" + JSON.stringify(state, null, 2));
  const [ editorView, setEditorView ] = useState(null);
  return (
    <div>
      <MenuView editorView={editorView} />
      <TextEditor state={state} setEditorView={setEditorView} />
    </div>
  );
};
