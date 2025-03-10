import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Form } from "./components";
import { createState } from "./lib/state";
import { compile, getData } from './swr/fetchers';
import './index.css';

function isNonNullObject(obj) {
  return (
    typeof obj === "object" &&
      obj !== null
  );
}

/*
  View manages the state of the form. It may or may not use the server compiler
  to handle state transitions. Its interface with the host is through the url
  search parameters and message passing. This is to ensure that it can be
  embedded in an iframe or rendered in a blank browser window without losing any
  functionality.

  There are two basic actions that need to be reduced by state: `update` and
  `compile`. 'update' triggers a recompile, and 'compile' registers the result
  of the compile.

  'state' can handle other, more specific, actions but they should follow the
  basic pattern of triggering a compile on update.

  If either 'accessToken' or 'id' is undefined, then recompiles are skipped. In
  that case any state transitions that need to occur must be handled by other
  methods.

  If the parent origin is provided, the view will post the state data to it when
  it chanages.
*/

const replaceVariables = (str, env) => {
  Object.keys(env).forEach(key => {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    str = str.replace(re, env[key]);
  });
  return str;
}

const isNonNullNonEmptyObject = obj => (
  typeof obj === "object" &&
    obj !== null &&
    Object.keys(obj).length > 0
);

const resolveVariables = (obj, env) => (
  Object.keys(obj).reduce((obj, key) => {
    const val = obj[key];
    if (typeof obj[key] === "string") {
      obj[key] = replaceVariables(val, env);
    } else if (isNonNullNonEmptyObject(val)) {
      obj[key] = resolveVariables(val, env);
    }
    return obj;
  }, obj)
);

export const View = () => {
  const [ id, setId ] = useState();
  const [ accessToken, setAccessToken ] = useState();
  const [ targetOrigin, setTargetOrigin ] = useState(null);
  const [ doInit, setDoInit ] = useState(true);
  const [ doRecompile, setDoRecompile ] = useState(false);
  const [ state ] = useState(createState({}, (data, { type, args }) => {
    // console.log(
    //   "L0151 state.apply()",
    //   "type=" + type,
    //   "args=" + JSON.stringify(args, null, 2)
    // );
    switch (type) {
    case "init":
      return {
        ...args,
      };
    case "compile":
      // TODO Merge compile data with current state data.
      // return {
      //   ...data,
      //   ...args,
      // };
    case "response":
    case "update":
      // setDoRecompile(true);
      return {
        ...data,
        ...args,
      };
    default:
      console.error(false, `Unimplemented action type: ${type}`);
      return data;
    }
  }));

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      setId(params.get("id"));
      setAccessToken(params.get("access_token"));
      setTargetOrigin(params.get("origin"));
      const data = params.get("data");
      if (data) {
        state.apply({
          type: "update",
          args: JSON.parse(data),
        });
      }
    }
  }, [window.location.search]);

  useEffect(() => {
    // If `id` changes, then get data to init state.
    if (id) {
      setDoInit(true);
    }
  }, [id]);

  useEffect(() => {
    if (targetOrigin) {
      window.parent.postMessage(state.data, targetOrigin);
    }
  }, [JSON.stringify(state.data)]);

  const initResp = useSWR(
    doInit && id && {
      accessToken,
      id,
    },
    getData
  );

  if (initResp.data) {
    const data = initResp.data;
    const templateVariablesRecords = data.templateVariablesRecords || [];
    const index = Math.floor(Math.random() * templateVariablesRecords.length);
    const env = templateVariablesRecords[index];
    const args = resolveVariables(data, env);
    state.apply({
      type: "init",
      args: initResp.data,
    });
    setDoInit(false);
  }

  const compileResp = useSWR(
    doRecompile && accessToken && id && {
      accessToken,
      id,
      data: state.data,
    },
    compile
  );

  if (compileResp.data) {
    state.apply({
      type: "compile",
      args: compileResp.data,
    });
    setDoRecompile(false);
  }

  return (
    isNonNullObject(state.data) &&
      <Form state={state} /> ||
      <div />
  );
}
