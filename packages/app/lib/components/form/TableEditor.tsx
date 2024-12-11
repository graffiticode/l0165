/*
  TODO
  [ ] Format numbers and dates using format patterns
  [ ] Make expanderBuilders a module parameter
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
import { rules } from './translatex-rules.js';

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
      const src = cellExprs && name && cellExprs.cells[name] || node.textContent;
      const val = src.indexOf("sum") > 0 && "300" || node.textContent;
      cells.push({
        row,
        col,
        name,
        src,
        val,
//        ast,
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
  return result;
};

// function clearCellContent(editorView, cellPos) {
//   const { state, dispatch } = editorView;
//   const cellNode = state.doc.nodeAt(cellPos);
//   if (!cellNode || cellNode.type.name !== "table_cell") {
//     console.error("Invalid cell position or node type: " + JSON.stringify(cellNode, null, 2));
//     return;
//   }
//   const contentStart = cellPos + 1;
//   const contentEnd = cellPos + cellNode.nodeSize - 1;
//   const tr = state.tr;

//   // Create a transaction to replace the paragraph's content with an empty content
//   const tr = state.tr.replaceWith(
//     paragraphPos + 1, // Start position of the paragraph's content
//     paragraphPos + paragraphNode.nodeSize - 1, // End position of the paragraph's content
//     state.schema.text("") // Replace with an empty text node
//   );

//   dispatch(tr);
//   console.log("Paragraph content cleared.");
// }

const replaceCellContent = (editorView, cellPos, newContent, doMoveCursor = false) => {
  const { state, dispatch } = editorView;
  const cellNode = state.doc.nodeAt(cellPos);
  if (!cellNode || cellNode.type.name !== "table_cell") {
    console.error("Invalid cell position or node type: " + JSON.stringify(cellNode, null, 2));
    return;
  }
  const contentStart = cellPos + 1;
  const contentEnd = cellPos + cellNode.nodeSize - 1;
  const tr = state.tr;
  tr.replaceWith(
    contentStart,
    contentEnd,
    state.schema.node("paragraph", null, state.schema.text(newContent))
  );
  if (doMoveCursor) {
    const selectionPos = Math.min(contentStart + newContent.length + 1, contentEnd - 1);
    tr.setSelection(TextSelection.create(tr.doc, selectionPos));
  }
  dispatch(tr);
}
const evalCell = ({ env, name }) => {
  const src = env.cells[name] || "";
  let result = src;
  try {
    const options = {
      allowThousandsSeparator: true,
      env: env.cells,
      ...rules,
    };
    if (src.length > 0) {
      TransLaTeX.translate(
        options,
        src, (err, val) => {
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
        if (pluginState.focusedCell) {
          const name = pluginState.focusedCell;
          const { pos } = getCellNodeByName({doc: view.state.doc, name});
          const src = pluginState.cells[name] || "";
          if (src) {
            replaceCellContent(view, pos, src, true);
          }
        }
        pluginState.dirtyCells.forEach(name => {
          const { pos } = getCellNodeByName({doc: view.state.doc, name});
          const val = evalCell({ env: pluginState, name });
          if (val) {
            replaceCellContent(view, pos, val);
          }
        });
      }
    };
  },
  state: {
    init() {
      return {
        lastFocusedCell: null,
        blurredCell: null,
        focusedCell: null,
        dirtyCells: [],
        cells: {},
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
          if (value.lastFocusedCell) {
            value = {
              ...value,
              blurredCell: value.lastFocusedCell,
              dirtyCells: [
                ...value.dirtyCells,
                value.lastFocusedCell,
              ],
            };
          }
          value = {
            ...value,
            lastFocusedCell: node.attrs.name,
            focusedCell: node.attrs.name,
          };
        } else if (name) {
          const src = node.textContent.trim();
          value = {
            ...value,
            blurredCell: null,
            focusedCell: null,
            dirtyCells: [],
            cells: {
              ...value.cells,
              [name]: src || undefined,
            },
          };
        }
      }
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
