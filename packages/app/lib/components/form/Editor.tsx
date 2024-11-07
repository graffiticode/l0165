import React from "react"; React;
import { MenuView } from "./MenuView";
import { TextEditor } from "./TextEditor";

export const Editor = ({ state }) => {
  const { type } = state.data;
  return (
    <div>
      <MenuView className="hidden" editorView={null} />
      {
        type === "table" && <div>Table Editor goes here.</div> ||
          type === "text" && <TextEditor state={state} /> ||
          <div />
      }
    </div>
  );
};
