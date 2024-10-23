import "../../index.css";
import { useState, useEffect } from "react";

import { ThemeToggle } from "./ThemeToggle";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function renderJSON(data) {
  delete data.schema;
  delete data.theme;
  return (
    <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
  );
}

function render({ state }) {
  const { data } = state;
  if (typeof data?.hello === "string") {
    return <span className="text-sm">{`hello, ${data.hello}!`}</span>;
  } else if (typeof data.image === "string") {
    return <img src={data.image} />;
  } else {
    return renderJSON(data);
  }
}

export const Form = ({ state }) => {
  const [ theme, setTheme ] = useState(state.data.theme);
  useEffect(() => {
    state.apply({
      type: "update",
      args: {
        theme,
      },
    });
  }, [theme]);
  return (
    <div
      className={classNames(
        theme === "dark" && "bg-zinc-900 text-white" || "bg-white text-zinc-900",
        "rounded-md font-mono flex flex-col gap-4 p-4"
      )}
    >
      {theme !== undefined && <ThemeToggle theme={theme} setTheme={setTheme} />}
      {render({state})}
    </div>
  );
}
