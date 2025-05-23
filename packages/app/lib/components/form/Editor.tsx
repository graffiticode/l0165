import React from "react"; React;
import { useState } from "react";
import { MenuView } from "./MenuView";
import { TextEditor } from "./TextEditor";
import { TableEditor } from "./TableEditor";

export const Editor = ({ state }) => {
  const [editorView, setEditorView] = useState(null);
  const type = state.data.interaction?.type;
  return (
    <div>
      <MenuView className="hidden" editorView={editorView} />
      {
        type === "table" && <TableEditor state={state} onEditorViewChange={setEditorView} /> ||
        type === "text" && <TextEditor state={state} /> ||
        <div />
      }
    </div>
  );
};
