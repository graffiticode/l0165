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
  } else {
    return renderJSON(data);
  }
}

export const Form = ({ state }) => {
  const [ theme, setTheme ] = useState(state?.data?.theme || "light");
  useEffect(() => {
    if (theme !== state?.data?.theme) {
      state.apply({
        type: "change",
        args: {
          theme,
        },
      });
    }
  }, [theme]);
  return (
    <div
      className={classNames(
        theme === "light" && "bg-white text-zinc-900" || "bg-zinc-900 text-white",
        "rounded-md font-mono flex flex-col gap-4 p-4"
      )}
    >
      <ThemeToggle theme={theme} setTheme={setTheme} />
      {render({state})}
    </div>
  );
}
