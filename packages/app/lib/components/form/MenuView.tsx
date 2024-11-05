import React from "react"; React;
import { toggleMark } from "prosemirror-commands";

function classNames(...classes) {
  const className = classes.filter(Boolean).join(' ')
  return className;
}

const items = [{
  name: "B",
  className: "font-bold",
  command: schema => toggleMark(schema.marks.strong),
  selected: false,
}, {
  name: "I",
  className: "italic",
  command: schema => toggleMark(schema.marks.em),
  selected: false,
}];

export const MenuView = ({ editorView }) => {
  const toggle = item => {
    item.selected = !item.selected;
    item.command(editorView.state.schema)(editorView.state, editorView.dispatch);
  };

  return (
    <div className="flex flex-row gap-1 mb-2 text-sm font-sans">
      {
        items.map(item => (
          <button
            className={classNames(
              "w-7 h-7 text-center border border-1 rounded",
              item.selected && "bg-gray-100",
              item.className
            )}
            onMouseDown={
              e => {
                e.preventDefault();
                editorView.focus();
                toggle(item);
              }
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

