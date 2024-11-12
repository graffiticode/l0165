import React from "react"; React;
import { useEffect, useState } from "react";

const updateTextNode = ({ editorView, from, to, text }) => {
  const { doc, tr } = editorView.state;
  const resolvedPos = doc.resolve(from);
  const start = resolvedPos.start(resolvedPos.depth)
  const end = resolvedPos.end(resolvedPos.depth);
  const transaction = (
    text.length > 0 &&
      tr.replaceWith(start, end, editorView.state.schema.text(text)) ||
      tr.delete(start, end)
  );
  editorView.dispatch(transaction);
}

export const FormulaBar = ({ editorView }) => {
  const { state } = editorView || {};
  const [ value, setValue ] = useState("");
  useEffect(() => {
    if (state) {
      const { from, to } = state.selection;
      const pos = state.doc.resolve(from);
      const node = state.doc.nodeAt(pos.pos - 1);
      const value = node?.textContent || "";
      setValue(value);
    }
  }, [state]);
  const handleChange = value => {
    setValue(value);
    const { from, to } = state.selection;
    updateTextNode({editorView, from, to, text: value});
  };
  return (
    <div className="flex flex-row gap-2 rounded-md">
      <label className="block text-md font-medium font-serif italic text-gray-500">
        fx
      </label>
      <input
        id="name"
        name="name"
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 sm:text-sm/6 focus:outline-0"
      />
    </div>
  )
}
