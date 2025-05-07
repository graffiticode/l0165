import React from "react"; React;
import "../../index.css";
import "./Form.css";
import { Editor } from "./Editor";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export const Form = ({ state }) => {
  return (
    <div
      className={classNames(
        "rounded-md font-mono flex flex-col gap-4 p-4"
      )}
    >
      {(state.data?.title || state.data?.instructions) && (
        <div className="instruction-panel mb-4 p-4 border border-gray-200 rounded-md">
          {state.data?.title && (
            <h1 className="text-xl font-bold mb-2">{state.data.title}</h1>
          )}
          {state.data?.instructions && (
            <p className="text-gray-700">{state.data.instructions}</p>
          )}
        </div>
      )}
      <Editor state={state} />
    </div>
  );
}
