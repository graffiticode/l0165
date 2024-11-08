import React from "react"; React;
import { MenuView } from "./MenuView";
import { TextEditor } from "./TextEditor";
import { TableEditor } from "./TableEditor";

export const Editor = ({ state }) => {
  const { type } = state.data;
  return (
    <div>
      <MenuView className="hidden" editorView={null} />
      {
        type === "table" && <TableEditor state={state} /> ||
        type === "text" && <TextEditor state={state} /> ||
        <div />
      }
    </div>
  );
};
