export const lexicon = {
  "print": {
    "tk": 1,
    "name": "PRINT",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Outputs a value to the form."
  },
  "get": {
    "tk": 1,
    "name": "GET",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Retrieves a value from a record or list by key or index."
  },
  "set": {
    "tk": 1,
    "name": "SET",
    "cls": "function",
    "length": 3,
    "arity": 3,
    "description": "Returns a new record or list with the specified key or index updated."
  },
  "nth": {
    "tk": 1,
    "name": "NTH",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns the nth element of a list by index."
  },
  "sub": {
    "tk": 1,
    "name": "SUB",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Subtracts the second number from the first."
  },
  "filter": {
    "tk": 1,
    "name": "FILTER",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns a list of elements that match a predicate."
  },
  "reduce": {
    "tk": 1,
    "name": "REDUCE",
    "cls": "function",
    "length": 3,
    "arity": 3,
    "description": "Reduces a list to a single value using a binary function and initial value."
  },
  "map": {
    "tk": 1,
    "name": "MAP",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Applies a function to each element in a list and returns a new list."
  },
  "lt": {
    "tk": 1,
    "name": "LT",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the first value is less than the second."
  },
  "le": {
    "tk": 1,
    "name": "LE",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the first value is less than or equal to the second."
  },
  "gt": {
    "tk": 1,
    "name": "GT",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the first value is greater than the second."
  },
  "ge": {
    "tk": 1,
    "name": "GE",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the first value is greater than or equal to the second."
  },
  "ne": {
    "tk": 1,
    "name": "NE",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the two values are not equal."
  },
  "len": {
    "tk": 1,
    "name": "LEN",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Returns the length of a list or string."
  },
  "concat": {
    "tk": 1,
    "name": "CONCAT",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Concatenates a list of strings or nested lists."
  },
  "add": {
    "tk": 1,
    "name": "ADD",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Adds two numbers."
  },
  "mul": {
    "tk": 1,
    "name": "MUL",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Multiplies two numbers."
  },
  "pow": {
    "tk": 1,
    "name": "POW",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Raises the first number to the power of the second."
  },
  "apply": {
    "tk": 1,
    "name": "APPLY",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Applies a function to a list of arguments."
  },
  "data": {
    "tk": 1,
    "name": "DATA",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Returns the raw data payload from a structured input."
  },
  "json": {
    "tk": 1,
    "name": "JSON",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Parses a string as JSON or serializes a value to JSON."
  },
  "eq": {
    "tk": 1,
    "name": "EQ",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the two values are equal."
  },
  "mod": {
    "tk": 1,
    "name": "MOD",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns the remainder of dividing the first number by the second."
  },
  "min": {
    "tk": 1,
    "name": "MIN",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns the smaller of two values."
  },
  "max": {
    "tk": 1,
    "name": "MAX",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns the larger of two values."
  },
  "range": {
    "tk": 1,
    "name": "RANGE",
    "cls": "function",
    "length": 3,
    "arity": 3,
    "description": "Generates a list of numbers from start to end using a step."
  },
  "not": {
    "tk": 1,
    "name": "NOT",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Returns the logical negation of a boolean value."
  },
  "equiv": {
    "tk": 1,
    "name": "EQUIV",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if the two values are semantically equivalent."
  },
  "or": {
    "tk": 1,
    "name": "OR",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if at least one of the two values is true."
  },
  "and": {
    "tk": 1,
    "name": "AND",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Returns true if both values are true."
  },
  "hd": {
    "tk": 1,
    "name": "HD",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Returns the first element of a list."
  },
  "tl": {
    "tk": 1,
    "name": "TL",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Returns the list without its first element."
  },
  "cons": {
    "tk": 1,
    "name": "CONS",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Prepends an element to the front of a list."
  },
  "append": {
    "tk": 1,
    "name": "APPEND",
    "cls": "function",
    "length": 2,
    "arity": 2,
    "description": "Appends an element to the end of a list."
  },
  "log": {
    "tk": 1,
    "name": "LOG",
    "cls": "function",
    "length": 1,
    "arity": 1,
    "description": "Logs the value to the console and returns the value (identity function)."
  },
  "title": {
    "tk": 1,
    "name": "TITLE",
    "cls": "function",
    "length": 2,
    "arity": 2
  },
  "instructions": {
    "tk": 1,
    "name": "INSTRUCTIONS",
    "cls": "function",
    "length": 2,
    "arity": 2
  },
  "params": {
    "tk": 1,
    "name": "PARAMS",
    "cls": "function",
    "length": 2,
    "arity": 2
  },
  "cells": {
    "tk": 1,
    "name": "CELLS",
    "cls": "function",
    "length": 2,
    "arity": 2
  },
  "rows": {
    "tk": 1,
    "name": "ROWS",
    "cls": "function",
    "length": 2,
    "arity": 2
  },
  "columns": {
    "tk": 1,
    "name": "COLUMNS",
    "cls": "function",
    "length": 2,
    "arity": 2
  }
}
