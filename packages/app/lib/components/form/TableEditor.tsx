/*
  TODO
  [ ] Cache cell value when computing functions
  [ ] Expand cell names using translatex to get dependencies
  [ ] Sort dependency tree
  [ ] Format numbers and dates using format patterns
  [ ] Make expanderBuilders a module parameter
  [ ] Make headings read only
  [x] Handle $ sign
  [x] Add dependencies of changed cells to dirty list
  [x] Add dependencies on init
*/

import React, { useState, useEffect, useRef } from 'react'; React;

import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-gapcursor/style/gapcursor.css';
import "prosemirror-tables/style/tables.css";

import { EditorView } from 'prosemirror-view';
import {
  EditorState,
  TextSelection,
} from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { keymap } from 'prosemirror-keymap';

import {
//   addColumnAfter,
//   addColumnBefore,
//   deleteColumn,
//   addRowAfter,
//   addRowBefore,
//   deleteRow,
//   mergeCells,
//   splitCell,
//   setCellAttr,
//   toggleHeaderRow,
//   toggleHeaderColumn,
//   toggleHeaderCell,
  goToNextCell,
  //   deleteTable,
  //findCell,
} from "prosemirror-tables";
import { tableEditing, columnResizing, tableNodes, fixTables } from "prosemirror-tables";

import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from "prosemirror-view";
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

import { TransLaTeX } from "@artcompiler/translatex";
import { evalRules, cellNameRules } from './translatex-rules.js';

const menuPlugin = new Plugin({
  view(editorView) {
    let menuDiv = document.createElement('div');
    editorView.dom.parentNode.insertBefore(menuDiv, editorView.dom);
    const update = () => {
      ReactDOM.render(
        <MenuView className="" editorView={editorView} />,
        menuDiv
      );
    };
    update();
    return {
      update,
      destroy() {
        ReactDOM.unmountComponentAtNode(menuDiv);
        menuDiv.remove();
      }
    };
  }
});

const applyDecoration = ({ doc, cells }) => {
  const decorations = [];
  cells.forEach(({ from, to, color, border }) => {
    decorations.push(Decoration.node(from, to, {
      style: `
        background-color: ${color};
        ${border};
      `
    }));
  });
  return DecorationSet.create(doc, decorations);
};

const applyModelRules = (state) => {
  const { doc, selection } = state;
  // Multiply first row and first column values and compare to body values.
  const cells = getCells(state);
  let rowVals = [];
  let colVals = [];
  let rowSums = [];
  let colSums = [];
  let cellColors = [];
  cells.forEach(({ row, col, val }) => {
    if (row === 1) {
      colVals[col] = val;
    } else {
      if (colSums[col] === undefined) {
        colSums[col] = val;
      } else {
        colSums[col] += val;
      }
    }
    if (cellColors[row] === undefined) {
      cellColors[row] = [];
    }
    if (col === 1) {
      rowVals[row] = val;
    } else {
      if (rowSums[row] === undefined) {
        rowSums[row] = val;
      } else {
        rowSums[row] += val;
      }
    }
    // const shapedTerms = shapeGridTermsByValue({ cells, terms });
    // const color = getGridCellColor({row, col, val, rowVals, colVals, terms: shapedTerms});
    cellColors[row][col] = "#fff"; //color;
  });
  const coloredCells = cells.map(cell => (
    {
      ...cell,
      readonly: cell.readonly,
      border: cell.col === 1 && cell.row === 1 && "border: 1px solid #ddd; border-right: 1px solid #aaa; border-bottom: 1px solid #aaa;" ||
        cell.col === 1 && "text-align: center; border: 1px solid #ddd; border-right: 1px solid #aaa;" ||
        cell.row === 1 && "text-align: center; border: 1px solid #ddd; border-bottom: 1px solid #aaa;" ||
        selection.anchor > cell.from && selection.anchor < cell.to &&
        `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 2px solid royalblue;` ||
        `font-weight: ${cell.fontWeight || "normal"}; text-align: ${cell.justify || "right"}; border: 1px solid #ddd;`,
      color: (cell.col === 1 || cell.row === 1) && "#fff" ||
        cell.background || "#fff"
    }
  ));
  return applyDecoration({doc, cells: coloredCells});
}

const modelBackgroundPlugin = () => new Plugin({
  state: {
    init(_, state) {
      return applyModelRules(state);
    },
    apply(tr, decorationSet, oldState, newState) {
      tr = tr;
      oldState = oldState;
      newState = newState;
      decorationSet = decorationSet;
      return applyModelRules(newState);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

const getCells = (state) => {
  const { doc } = state;
  const cells = [];
  let row = 0, col = 0;
  doc.descendants((node, pos) => {
    if (node.type.name === "table_row") {
      row++;
      col = 0;
    }
    if (node.type.name === "table_cell") {
      col++;
      const cellExprs = cellPlugin.getState(state);
      const name = node.attrs.name;
      const text = cellExprs && name && cellExprs.cells[name]?.text || node.textContent;
      cells.push({
        row,
        col,
        name,
        text,
        from: pos,
        to: pos + node.nodeSize,
        justify: node.attrs.justify,
        background: node.attrs.background,
        fontWeight: node.attrs.fontWeight,
      });
    }
  });
  return cells;
};

const debouncedStateUpdate = debounce(({ state, editorState }) => {
  state.apply({
    type: "update",
    args: {editorState},
  });
}, 1000);

const schema = new Schema({
  nodes: baseSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'paragraph',
      cellAttributes: {
        name: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.name || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.dataset = `data-name: ${value};`;
            }
          },
        },
        justify: {
          default: null,
          getFromDOM(dom) {
            return dom.style.textAlign || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `text-align: ${value};`;
          },
        },
        readonly: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.readonly || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs['data-readonly'] = value;
          },
        },
        background: {
          default: null,
          getFromDOM(dom) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
          },
        },
        fontWeight: {
          default: null,
          getFromDOM(dom) {
            return dom.style.fontWeight || null;
          },
          setDOMAttr(value, attrs) {
            if (value)
              attrs.style = (attrs.style || '') + `font-weight: ${value};`;
          },
        },
      },
    }),
  ),
  marks: baseSchema.spec.marks,
});

const getCellNodeByName = ({doc, name}) => {
  let result;
  doc.descendants((node, pos) => {
    if (result !== undefined) {
      return false;
    }
    if (node.type.name === "table_cell" && node.attrs.name === name) {
      result = {node, pos};
    }
  });
  result = result || {};
  return result;
};

const isValidCursorPos = (pos, contentStart, contentEnd) => {
  return pos >= contentStart && pos <= contentEnd;
};

const replaceCellContent = (editorView, name, newText, doMoveCursor = false) => {
  const { state, dispatch } = editorView;
  const { pos: cellPos } = getCellNodeByName({doc: state.doc, name});
  const cellNode = state.doc.nodeAt(cellPos);
  if (!cellNode || cellNode.type.name !== "table_cell") {
    console.error("Invalid cell position or node type: " + JSON.stringify(cellNode, null, 2));
    return;
  }
  const contentStart = cellPos + 1;
  const contentEnd = cellPos + cellNode.nodeSize - 1;
  const paragraphNode = newText &&
        state.schema.node("paragraph", null, state.schema.text(newText)) ||
        state.schema.node("paragraph");
  const tr = state.tr;
  tr.replaceWith(contentStart, contentEnd, paragraphNode);
  // console.log("replaceCellContent() doMoveCursor=" + doMoveCursor,
  //             "newText=" + newText);
  if (doMoveCursor) {
    let cursorPos = Math.max(contentStart + newText.length + 1, contentEnd - 1);
    tr.setSelection(TextSelection.create(tr.doc, cursorPos));
    setTimeout(() => {
      const doc = editorView.state.doc;
      const { pos: cellPos, node: updatedCellNode } = getCellNodeByName({doc, name});
      const updatedContentStart = cellPos + 1;
      const updatedContentEnd = cellPos + updatedCellNode.nodeSize - 1;
      if (!isValidCursorPos(cursorPos, updatedContentStart, updatedContentEnd)) {
        cursorPos = Math.min(updatedContentStart + newText.length, updatedContentEnd - 1);
      }
      editorView.dispatch(
        editorView.state.tr.setSelection(TextSelection.create(doc, cursorPos))
      );
    }, 0);
  }
  dispatch(tr);
}


const evalCell = ({ env, name }) => {
  const text = env.cells[name]?.text || "";
  let result = text;
  try {
    const options = {
      allowThousandsSeparator: true,
      env: env.cells,
      ...evalRules,
    };
    if (text.length > 0) {
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val;
        }
      );
    } else {
      result = text;
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
}

const getSingleCellDependencies = ({ env, name }) => {
  const text = env.cells[name]?.text || "";
  let result = text;
  try {
    const options = {
      allowThousandsSeparator: true,
      env: env.cells,
      ...cellNameRules,
    };
    if (text.length > 0) {
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          // console.log(
          //   "getSingleCellDependencies()",
          //   "name=" + name,
          //   "val=" + val
          // ),
          result = val.split(",").map(name => name.toUpperCase());
        }
      );
    } else {
      result = [];
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
};

const getCellDependencies = ({ env, names }) => (
  // console.log(
  //   "getCellDependencies()",
  //   "names=" + names
  // ),
  names.reduce((deps, name) => {
    const names = getSingleCellDependencies({env, name});
    return [...new Set([
      ...deps,
      ...names,
      ...getCellDependencies({env, names})
    ])];
  }, [])
);

const cellPlugin = new Plugin({
  view(editorView) {
    editorView = editorView;
    return {
      update(view) {
        const { state, dispatch } = view;
        const pluginState = cellPlugin.getState(state);
        if (pluginState.dirtyCells.length > 0) {
          const tr = state.tr;
          tr.setMeta("updated", true);
          dispatch(tr);
        }
        pluginState.dirtyCells.forEach(name => {
          // if (name === pluginState.focusedCell) {
          //   return;
          // }
          const val = evalCell({ env: pluginState, name });
          const { node } = getCellNodeByName({doc: view.state.doc, name});
          // console.log(
          //   "[1] cellPlugin/update()",
          //   "name=" + name,
          //   "val=" + val,
          //   "textContent=" + node.textContent
          // );
          if (name !== pluginState.focusedCell && val !== node.textContent) {
            replaceCellContent(view, name, val);
          }
        });
        if (pluginState.focusedCell) {
          const name = pluginState.focusedCell;
          const text = pluginState.cells[name]?.text || "";
          const { node } = getCellNodeByName({doc: view.state.doc, name});
          // console.log(
          //   "[2] cellPlugin/update()",
          //   "focusedCell=" + name,
          //   "text=" + text,
          //   "textContent=" + node.textContent
          // );
          if (text !== node.textContent) {
            replaceCellContent(view, name, text, true);
          }
        }
      }
    };
  },
  state: {
    init(config, state) {
      config = config;
      const cells = getCells(state).reduce((cells, cell) => (
        cell.row > 1 && cell.col > 1 && cell.text && {
          ...cells,
          [cell.name]: {
            text: cell.text,
            deps: [],
          }
        } || cells
      ), {});
      const dirtyCells = getCells(state).reduce((dirtyCells, cell) => (
        cell.row > 1 && cell.col > 1 &&
          cell.text && cell.text.indexOf("=") > -1 &&
          [...dirtyCells, cell.name] || dirtyCells
      ), []);

      const cellsWithDeps = getCells(state).reduce((cells, cell) => {
        if (cell.row > 1 && cell.col > 1 && cell.text)  {
          const deps = getCellDependencies({env: {cells}, names: [cell.name]});
          const cellName = cell.name;
          return deps.reduce((cells, name) => {
            // Add current cell as dependency of independent cells.
            const val = evalCell({env: {cells}, name});
            const cell = cells[name];
            return cell && {
              ...cells,
              [name]: {
                ...cell,
                val,
                deps: [
                  ...cell?.deps,
                  cellName,
                ],
              },
            } || cells;
          }, cells);
        } else {
          return cells;
        }
      }, cells);
      return {
        lastFocusedCell: null,
        blurredCell: null,
        focusedCell: null,
        dirtyCells,
        cells: cellsWithDeps,
      };
    },
    apply(tr, value, oldState, newState) {
      tr = tr;
      oldState = oldState;
      newState = newState;
      const { selection } = newState;
      const $anchor = selection.$anchor;
      let node = $anchor.node(-1);
      if (node.type.name !== "table_cell") {
        // Selection outside of cell, so use A1.
        const { doc } = newState;
        ({ node } = getCellNodeByName({doc, name: "A1"}));
      }
      if (tr.getMeta("updated")) {
        value = {
          ...value,
          focusedCell: null,
          dirtyCells: [],
        };
      }
      if (node && node.type.name === "table_cell") {
        const name = node.attrs.name;
        if (value.lastFocusedCell !== name) {
          // We just left a cell, so recompute its value and the values of its
          // dependencies.
          if (value.lastFocusedCell) {
            const { lastFocusedCell } = value;
            const cell = value.cells[lastFocusedCell];
            value = {
              ...value,
              blurredCell: lastFocusedCell,
              cells: {
                ...value.cells,
                [lastFocusedCell]: {
                  ...cell,
                  val: evalCell({env: value, name: lastFocusedCell}),
                  deps: [
                    ...cell?.deps,
                    ...!cell.deps.includes(lastFocusedCell) && [lastFocusedCell] || [],
                  ],
                },
              },
              dirtyCells: [
                // FIXME if the text hasn't changed then don't amend dirtyCells.
                ...value?.dirtyCells,
                lastFocusedCell,  // Order matters.
                ...(cell.deps || []),
              ],
            };
            const deps = getCellDependencies({env: value, names: [lastFocusedCell]});
            value = deps.reduce((value, name) => {
              // Add current cell as dependency of independent cells.
              const cell = value.cells[name];
              return cell && {
                ...value,
                cells: {
                  ...value.cells,
                  [name]: {
                    ...cell,
                    val: evalCell({env: value, name}),
                    deps: [
                      ...cell?.deps,
                      ...!cell.deps.includes(lastFocusedCell) && [lastFocusedCell] || [],
                    ],
                  },
                },
              } || value;
            }, value);
            if (cell.deps.includes(name)) {
              // If the focusedCell depends on the lastFocusedCell, update its
              // its so its dependents are updated.
              const val = evalCell({ env: value, name });
              value = {
                ...value,
                cells: {
                  ...value.cells,
                  [name]: {
                    ...value.cells[name],
                    val: val || undefined,
                  },
                },
              };
            }
          }
          value = {
            ...value,
            lastFocusedCell: node.attrs.name,
            focusedCell: node.attrs.name,
          };
        } else if (name) {
          const text = node.textContent.trim();
          const val = evalCell({ env: value, name });
          // console.log(
          //   "cellPlugin/apply()",
          //   "name=" + name,
          //   "text=" + text,
          //   "val=" + val
          // );
          value = {
            ...value,
            blurredCell: null,
            focusedCell: null,
            dirtyCells: [],
            cells: {
              ...value.cells,
              [name]: {
                ...value.cells[name],
                text: text || undefined,
                val: val || undefined,
              },
            },
          };
        }
      }
      // console.log(
      //   "cellPlugin/apply()",
      //   "value=" + JSON.stringify(value, null, 2)
      // );
      return value;
    }
  }
});

const plugins = [
  columnResizing(),
  tableEditing(),
  history(),
  keymap({"Mod-z": undo, "Mod-y": redo}),
  keymap({
    ...baseKeymap,
    Tab: goToNextCell(1),
    'Shift-Tab': goToNextCell(-1),
  }),
  menuPlugin,
  modelBackgroundPlugin(),
  cellPlugin,
];

let initEditorState = EditorState.create({
  schema,
  plugins,
});
const fix = fixTables(initEditorState);
if (fix) initEditorState = initEditorState.apply(fix.setMeta('addToHistory', false));

class ParagraphView {
  public dom;
  public contentDOM;
  private value = "";
  private textContent = "";
  private hasFocus = false;
  constructor(node, view) {
    view = view;
    this.dom = document.createElement("div");
    this.dom.className = "custom-paragraph";
    this.contentDOM = document.createElement("p");
    this.dom.appendChild(this.contentDOM);
    if (node.content.size == 0) this.dom.classList.add("empty")
  }
  update(node) {
    if (node.type.name !== "paragraph") {
      return false
    }
    this.dom.classList.remove("empty");
    if (this.hasFocus) {
      if (node.content.size > 0) {
        this.textContent = node.textContent;
        this.value = this.hasFocus && this.textContent.indexOf("sum") > 0 && "300" || this.textContent;
        this.contentDOM.textContent = this.textContent;
      } else {
        this.contentDOM.textContent = this.value || this.contentDOM.textContent;
        }
    } else {
      this.dom.classList.add("empty")
    }
    return true
  }
}

export const TableEditor = ({ state }) => {
  const [ editorView, setEditorView ] = useState(null);
  const editorRef = useRef(null);
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const editorView = new EditorView(editorRef.current, {
      state: initEditorState,
      dispatchTransaction(transaction) {
        const editorState = editorView.state.apply(transaction);
        editorView.updateState(editorState);
        debouncedStateUpdate({
          state,
          editorState: editorState.toJSON()
        });
      },
      nodeViews: {
        paragraph(node, view) { return new ParagraphView(node, view) }
      }
    });
    setEditorView(editorView);
    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  }, []);
  const { editorState } = state.data;
  useEffect(() => {
    if (editorView && editorState) {
      const newEditorState = EditorState.fromJSON({
        schema,
        plugins,
      }, editorState);
      editorView.updateState(newEditorState);
      const { pos } = getCellNodeByName({doc: newEditorState.doc, name: "A1"});
      if (!pos) return;
      const resolvedPos = newEditorState.doc.resolve(pos);
      editorView.dispatch(editorView.state.tr.setSelection(new TextSelection(resolvedPos)));
    }
  }, [editorView, editorState]);
  return (
    <div
      ref={editorRef}
      className="border border-gray-300 p-2 bg-white text-xs font-sans"
    />
  );
};
