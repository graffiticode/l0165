import React from "react"; React;
import { MenuView } from "./MenuView";
import { TextEditor } from "./TextEditor";

export const Editor = ({ state }) => {
  return (
    <div>
      <MenuView className="hidden" editorView={null} />
      <TextEditor state={state} />
    </div>
  );
};
