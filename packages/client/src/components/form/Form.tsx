//import React, { useState, useEffect, useRef } from 'react';

function isNonNullObject(obj) {
  return (typeof obj === "object" && obj !== null);
}

function renderJSON(data, depth = 0) {
  delete data.schema;
  return (
    <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
  );
}

function render({state}) {
  const { data } = state;
  if (typeof data.hello === "string") {
    return <span className="text-sm">{`hello, ${data.hello}!`}</span>;
  } else {
    return renderJSON(data);
  }
}

export const Form = ({ state }) => {
  return (
    <div className="p-2">
      { render({state}) }
    </div>
  );
}
