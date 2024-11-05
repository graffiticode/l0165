import React from "react"; React;
import { useState } from "react";
import { toggleMark } from "prosemirror-commands";

function classNames(...classes) {
  const className = classes.filter(Boolean).join(' ')
  return className;
}

export const MenuBar = ({ editorView }) => {
  const [ bold, setBold ] = useState(false);
  const [ italic, setItalic ] = useState(false);
  const toggleBold = () => {
    setBold(!bold);
    const { schema } = editorView.state;
    toggleMark(schema.marks.strong)(editorView.state, editorView.dispatch);
  };

  const toggleItalic = () => {
    setItalic(!italic);
    const { schema } = editorView.state;
    toggleMark(schema.marks.em)(editorView.state, editorView.dispatch);
  };

  return (
    <div className="flex flex-row gap-1 mb-2 text-sm font-sans">
      <button
        className={classNames(
          "w-7 h-7 text-center border border-1 rounded",
          bold && "bg-gray-100"
        )}
        onClick={toggleBold}><b>B</b></button>
      <button
        className={classNames(
          "w-7 h-7 text-center border border-1 rounded",
          italic && "bg-gray-100"
        )}
        onClick={toggleItalic}><i>I</i></button>
    </div>
  );
};
