import React from "react"; React;
import "../../index.css";
import "./Form.css";
import { Editor } from "./Editor";
import ReactMarkdown from 'react-markdown';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function renderErrors(errors: { message: string; from: number; to: number }[]) {
  return (
    <div className="flex flex-col gap-2">
      {errors.map((error, i) => (
        <div
          key={i}
          className="rounded-md p-3 border text-sm bg-red-50 border-red-200 text-red-800"
        >
          {error.message}
        </div>
      ))}
    </div>
  );
}

export const Form = ({ state }) => {
  if (Array.isArray(state.data?.errors) && state.data.errors.length > 0) {
    return renderErrors(state.data.errors);
  }
  return (
    <div
      className={classNames(
        "rounded-md font-mono flex flex-col gap-4 p-4"
      )}
    >
      {(state.data?.title || state.data?.instructions) && (
        <div className="instruction-panel mb-4 p-4 border border-gray-200 rounded-none font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
          {state.data?.title && (
            <h1 className="text-xl font-bold mb-2">
              <ReactMarkdown>{state.data.title}</ReactMarkdown>
            </h1>
          )}
          {state.data?.instructions && (
            <div className="text-gray-700 prose max-w-none">
              <ReactMarkdown
                components={{
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />
                }}
              >
                {state.data.instructions}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
      <Editor state={state} />
    </div>
  );
}
