/*
  TODO
  [ ] Select cell adjacent to selected header
  [ ] FIXME when no longer editing a cell, add it to the dirty list
  [ ] Make row and column headings read only. Focus on first cell
  [ ] Format numbers and dates using format patterns
  [ ] Handle single and double click and tab in cells
  [ ] Sort dependency tree & check for cycles
  [ ] Make expanderBuilders a module parameter
  [x] Handle $ sign
  [x] Add dependencies of changed cells to dirty list
  [x] Add dependencies on init
  [x] Cache cell value when computing functions
  [x] Expand cell names using translatex to get dependencies
  [x] Support '=a1' and '=a1+b2' syntax
  [x] Fix bug focusing cell with text shorter than value
  [x] Support literals in expressions. E.g. =b2*0.14
  [x] Parse cell names in parselatex to fix '=a1*a2' and '=a1/a2'
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
  TableMap,
} from "prosemirror-tables";
import {
  tableEditing,
  columnResizing,
  tableNodes,
  fixTables,
  CellSelection,
} from "prosemirror-tables";

import { baseKeymap } from "prosemirror-commands"
import { undo, redo, history } from "prosemirror-history";
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from "prosemirror-view";
import ReactDOM from 'react-dom';
import { MenuView } from './MenuView';
import { debounce } from "lodash";

import { TransLaTeX } from "@artcompiler/translatex";
import { evalRules, cellNameRules, formatRules } from './translatex-rules.js';

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

const isTableCellOrHeader = node =>
      node.type.name === "table_cell" ||
      node.type.name === "table_header";

// const isTableCell = node =>
//       node.type.name === "table_cell";

const getCells = (state) => {
  const { doc } = state;
  const cells = [];
  let row = 0, col = 0;
  doc.descendants((node, pos) => {
    if (node.type.name === "table_row") {
      row++;
      col = 0;
    }
    if (isTableCellOrHeader(node)) {
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
        format: node.attrs.format,
      });
    }
  });
  // console.log(
  //   "getCells()",
  //   "cells=" + JSON.stringify(cells, null, 2)
  // );
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
        format: {
          default: null,
          getFromDOM(dom) {
            return dom.dataset.format || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.dataset = `data-format: ${value};`;
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

const findTable = $pos => {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.type.name === "table") {
      return { pos: $pos.before(depth), node };
    }
  }
  return null;
}

const getTablePosition = state => {
  const { $from } = state.selection;
  const table = findTable($from);
  return table ? table.pos : null;
}

const letters = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getCellRowColFromName = name => {
  const colName = name.slice(0, 1);
  const rowName = name.slice(1);
  const col = letters.indexOf(colName);
  const row = +rowName;
  return {row, col};
};

const getCellNodeByName = ({ state, name }) => {
  const tablePos = getTablePosition(state);
  const tableNode = state.doc.nodeAt(tablePos);
  const tableMap = TableMap.get(tableNode);
  const { row, col } = getCellRowColFromName(name);
  const cellIndex = row * tableMap.width + col;
  const cellPos = tableMap.map[cellIndex] + tablePos + 1;
  const cellNode = state.doc.nodeAt(cellPos);
  return {node: cellNode, pos: cellPos};
}

const getAdjacentCellNodeByName = ({ state, name }) => {
  const { row, col } = getCellRowColFromName(name);
  const adjRow = row === 0 && row + 1 || row;
  const adjCol = col === 0 && col + 1 || col;
  const name = `${letters[adjCol]}${adjRow}`;
  return getCellNodeByName({state, name});
}

// const getCellNodeByName = ({doc, name}) => {
//   let result;
//   doc.descendants((node, pos) => {
//     if (result !== undefined) {
//       return false;
//     }
//     if (isTableCellOrHeader(node) && node.attrs.name === name) {
//       result = {node, pos};
//     }
//   });
//   result = result || {};
//   return result;
// };

const replaceCellContent = (editorView, name, newText, doMoveCursor = false) => {
  const { state, dispatch } = editorView;
  const { pos: cellPos, node: cellNode } = getCellNodeByName({state, name});
  if (!cellNode || !isTableCellOrHeader(cellNode)) {
    console.error("Invalid cell position or node type: " + JSON.stringify(cellNode, null, 2));
    return;
  }
  // FIXME verify that this is the correct position.
  const contentStart = cellPos + 1;
  const contentEnd = cellPos + cellNode.nodeSize - 1;
  const paragraphNode = newText &&
        state.schema.node("paragraph", null, state.schema.text(newText)) ||
        state.schema.node("paragraph");
  // console.log(
  //   "replaceCellContent()",
  //   "name=" + name,
  //   "newText=" + newText,
  //   "cellNode=" + JSON.stringify(cellNode, null, 2),
  //   "paragraphNode=" + JSON.stringify(paragraphNode, null, 2)
  // );
  const tr = state.tr;
  tr.replaceWith(contentStart, contentEnd, paragraphNode);
  if (doMoveCursor) {
    let cursorPos = contentStart + 1;
    tr.setSelection(TextSelection.create(tr.doc, cursorPos + newText.length));
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
    if (text.length > 0 && text.indexOf("=") === 0) {
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val;
        }
      );
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  return result;
}

const formatCellValue = ({ env, name }) => {
  const { val, format } = env.cells[name] || {};
  let result = val;
  // console.log(
  //   "[1] formatCellValue()",
  //   "env=" + JSON.stringify(env, null, 2),
  //   "name=" + name,
  //   "format=" + format,
  //   "result=" + result
  // );
  try {
    if (format && val.length > 0) {
      const options = {
        env: {format},
        ...formatRules,
      };
      TransLaTeX.translate(
        options,
        val, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
          result = val;
        }
      );
    }
  } catch (x) {
    console.log("parse error: " + x.stack);
  }
  // console.log(
  //   "[2] formatCellValue()",
  //   "name=" + name,
  //   "result=" + result
  // );
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
    if (text.length > 0 && text.indexOf("=") === 0) {
      // FIXME this condition is brittle.
      TransLaTeX.translate(
        options,
        text, (err, val) => {
          if (err && err.length) {
            console.error(err);
          }
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

const getCellDependencies = ({ env, names }) => {
  const deps = names.reduce((deps, name) => {
    const names = getSingleCellDependencies({env, name});
    return [...new Set([
      ...deps,
      ...names,
      ...getCellDependencies({env, names})
    ])];
  }, []);
  return deps;
};

const makeTableHeadersReadOnlyPlugin = new Plugin({
  props: {
    handleClickOn(view, pos, node, nodePos, event, direct) {
      pos = pos;
      event = event;
      direct = direct;
      const { state, dispatch } = view;

      // Check if the clicked node is a `table_header`
      if (node.type.name === "table_header") {
        // Create a CellSelection for the clicked cell
        const { pos, node } = getAdjacentCellByName(name);
        const selection = CellSelection.create(state.doc, nodePos);

        // Dispatch the transaction to update the selection
        dispatch(state.tr.setSelection(selection));
        return true; // Prevent further handling
      }

      return false; // Allow other events to be handled normally
    },

    handleDOMEvents: {
      beforeinput(view, event) {
        const { state } = view;
        const { selection } = state;
        const $pos = selection.$anchor;

        for (let depth = $pos.depth; depth > 0; depth--) {
          const node = $pos.node(depth);
          if (node.type.name === "table_header") {
            event.preventDefault();
            return true;
          }
        }
        return false;
      }
    },

    // handleKeyDown(view, event) {
    //   const { state } = view;
    //   const { selection } = state;
    //   const $pos = selection.$anchor;

    //   for (let depth = $pos.depth; depth > 0; depth--) {
    //     const node = $pos.node(depth);
    //     if (node.type.name === "table_header") {
    //       event.preventDefault(); // Block key event
    //       return true; // Stop further handling
    //     }
    //   }
    //   return false; // Allow other key events
    // }
  },

  filterTransaction(tr, state) {
    const { selection } = state;
    const $pos = selection.$anchor;

    for (let depth = $pos.depth; depth > 0; depth--) {
      const node = $pos.node(depth);
      if (node.type.name === "table_header") {
        if (tr.steps.length > 0) {
          return false;
        }
      }
    }
    return true;
  }
});

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
        const cells = {...pluginState.cells};
        pluginState.dirtyCells.forEach(name => {
          const val = evalCell({ env: {cells}, name });
          cells[name] = {
            ...cells[name],
            val,
          };
          const formattedVal = formatCellValue({env: {cells}, name});
          const { node } = getCellNodeByName({state: view.state, name});
          // console.log(
          //   "[1] cellPlugin/view/update()",
          //   "name=" + name,
          //   "focusedCell=" + pluginState.focusedCell,
          //   "textContent=" + node.textContent,
          //   "formattedVal=" + formattedVal,
          //   "name !== pluginState.focusedCell=" + (name !== pluginState.focusedCell),
          //   "formattedVal !== node.textContent=" + (formattedVal !== node.textContent)
          // );
          if (name !== pluginState.focusedCell && formattedVal !== node.textContent) {
            replaceCellContent(view, name, formattedVal);
          }
        });
        if (pluginState.focusedCell) {
          const name = pluginState.focusedCell;
          const text = pluginState.cells[name]?.text || "";
          const { node } = getCellNodeByName({state: view.state, name});
          // console.log(
          //   "[2] cellPlugin/view/update()",
          //   "name=" + name,
          //   "text=" + text,
          //   "node=" + JSON.stringify(node, null, 2)
          // );
          if (node.type.name === "table_cell" && text !== node.textContent) {
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
        cell.row > 1 && cell.col > 1 && {
          ...cells,
          [cell.name]: {
            ...cell,
            deps: [],
          }
        } || cells
      ), {});
      const dirtyCells = getCells(state).reduce((dirtyCells, cell) => (
        cell.row > 1 && cell.col > 1 && cell.text &&
          [...dirtyCells, cell.name] ||
          dirtyCells
      ), []);
      const cellsWithDeps = getCells(state).reduce((cells, cell) => {
        if (cell.row > 1 && cell.col > 1)  {
          const deps = getCellDependencies({env: {cells}, names: [cell.name]});
          const cellName = cell.name;
          return deps.reduce((cells, name) => {
            // Add current cell as dependency of independent cells.
            const val = evalCell({env: {cells}, name});
            const cell = cells[name];
            // console.log(
            //   "cellsPugin/init()",
            //   "name=" + name,
            //   "cell=" + JSON.stringify(cell, null, 2)
            // );
            return cell && {
              ...cells,
              [name]: {
                ...cell,
                val,
                deps: [
                  ...cell?.deps,
                  cellName,
                ],
                format: cell.format,
              },
            } || cells;
          }, cells);
        } else {
          return cells;
        }
      }, cells);
      // console.log(
      //   "cellsPugin/state/init()",
      //   "cellsWithDeps=" + JSON.stringify(cellsWithDeps, null, 2)
      // );
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
      if (tr.getMeta("updated")) {
        value = {
          ...value,
          focusedCell: null,
          dirtyCells: [],
        };
      }
      const { selection } = newState;
      const $anchor = selection.$anchor;
      const node = $anchor.node(-1);
      const name = node.attrs?.name;
      const lastFocusedCell = value.lastFocusedCell;
      if (lastFocusedCell !== name) {
        // We just left a cell, so recompute its value and the values of its
        // dependencies.
        if (lastFocusedCell) {
          //const { lastFocusedCell } = value;
          const cell = value.cells[lastFocusedCell];
          value = {
            ...value,
            blurredCell: lastFocusedCell,
            cells: {
              ...value.cells,
              [lastFocusedCell]: {
                ...cell,
                val: evalCell({env: value, name: lastFocusedCell}),
              },
            },
            dirtyCells: [
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
          if (cell.deps?.includes(name)) {
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
        // console.log(
        //   "[2] cellPlugin/state/apply()",
        //   "value=" + JSON.stringify(value, null, 2)
        // );
      } else if (isTableCellOrHeader(node) && node.attrs?.name) {
        const name = node.attrs.name;
        const text = node.textContent.trim();
        const val = evalCell({env: value, name});
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
      // console.log(
      //   "cellPlugin/state/apply()",
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
  makeTableHeadersReadOnlyPlugin,
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
      const { pos } = getCellNodeByName({state: newEditorState, name: "A1"});
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
