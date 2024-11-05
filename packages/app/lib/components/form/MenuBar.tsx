import React from "react"; React;
import { toggleMark } from "prosemirror-commands";

function classNames(...classes) {
  const className = classes.filter(Boolean).join(' ')
  return className;
}

const items = [{
  name: "B",
  commandName: "",
  selected: false,
}, {
  name: "I",
  commandName: "",
  selected: false,
}];

export const MenuBar = ({ editorView }) => {
  const toggle = item => {
    item.selected = !item.selected;
    const { schema } = editorView.state;
    let mark;
    switch (item.name) {
    case "B":
      mark = schema.marks.strong;
      break;
    case "I":
      mark = schema.marks.em;
      break;
    default:
      break;
    }
    toggleMark(mark)(editorView.state, editorView.dispatch);
  };

  return (
    <div className="flex flex-row gap-1 mb-2 text-sm font-sans">
      {
        items.map(item => (
          <button
            className={classNames(
              "w-7 h-7 text-center border border-1 rounded",
              item.selected && "bg-gray-100"
            )}
            onMouseDown={
              (e) => {
                e.preventDefault()
                editorView.focus()
                toggle(item)}
            }>
            {
              item.name
            }
          </button>
        ))
      }
    </div>
  );
};
