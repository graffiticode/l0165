import React from "react"; React;
import "../../index.css";
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
      <Editor state={state} />
    </div>
  );
}
