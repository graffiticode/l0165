import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Form } from "./components";
import { createState } from "./lib/state";
import { compile } from './swr/fetchers';
import assert from "assert";
import './index.css';

function isNonNullNonEmptyObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null &&
      Object.keys(obj).length > 0
  );
}

export const View = () => {
  const [ id, setId ] = useState();
  const [ accessToken, setAccessToken ] = useState();
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ height, setHeight ] = useState(0);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      setId(params.get("id"));
      const accessToken = params.get("access_token");
      setAccessToken(accessToken);
    }
  }, [window.location.search]);

  useEffect(() => {
    // If `id` changes, then recompile.
    if (id) {
      setDoRecompile(true);
    }
  }, [id]);

  const [ state ] = useState(createState({}, (data, { type, args }) => {
    //console.log("L0002 state.apply() type=" + type + " args=" + JSON.stringify(args, null, 2));
    switch (type) {
    case "compiled":
      return {
        ...data,
        ...args,
      };
    case "change":
      setRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  const compileResp = useSWR(
    doRecompile && accessToken && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  if (compileResp.data) {
    assert(compileResp.data.data === undefined);
    state.apply({
      type: "compiled",
      args: compileResp.data,
    });
    setDoRecompile(false);
  }

  return (
    isNonNullNonEmptyObject(state.data) &&
      <Form state={state} /> ||
      <div />
  );
}
