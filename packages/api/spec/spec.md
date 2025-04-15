# L0151 | Spec

## Overview
Graffiticode is a purely functional, punctuation-light programming language
designed for end-user programming of task specific Micro-SaaS applications.
Programs compile to static data and interpreted by the Micro-SaaS runtime.

L0151 is a dialect of Graffiticode. Dialects specialize Graffiticode with
task specific builtin functions and runtimes. L0151 is a starter language
with a dialect that includes support for two functions: `hello` and `theme`.


## Core Principles
- Purely functional semantics
- Fixed arity for all functions
- Prefix notation only (no infix operators)
- Minimal punctuation; whitespace is only used as a token separator
- Commas are redundant in lists and records but allowed for readability
- Parens are redundant around function applications but allowed for readability
- Fully inferred static types (no type annotations)
- Lambdas and function applications fully resolved at compile time
- Compiled output is pure data; runtime handles side effects

## Programs
A program is one or more let declarations followed by a single expression
terminated by the `..` token.

```
print "hello, world!"..
```

```
let greeting = "hello"..
let greeted = "world"..
print concat [greeting "," greeted "!"]..
```

## Execution Model
- All function applications are fully resolved at compile time
- Compiled output contains no lambdas, only static data
- Runtime may look up external data or perform side effects
- Error handling:
  - Syntax errors: handled by the parser
  - Static errors: handled by the compiler
  - Runtime errors: handled by asserts in the client code

## Comments
Line comments begin with `|`. The `|` character and every other character
between it and the end of the current line are ignored.

```
| This is a comment
```
```
let x = 10..  | This is also a comment
```

## Let Declarations
Symbols are defined with expressions that begin with the `let` keyword and end
with the `..` punctuation.

```
let x = 10..
```
```
let plus = <x y: add x y>..
```

## Values
### Numbers
Integers and floats (including negative numbers)

```
42
```
```
-3.14
```

### Strings
Strings can be multiline and include embedded expressions.

```
"hello"
```

Strings can be multiline.

```
'hello,
world!'
```
```
let x = "world"..
`hello, ${x}!`
```

### Booleans

```
true
```
```
false
```

### Null
```
null
```

### Lists
List are denoted with brackets and space-separated elements (commas are optional).
They are immutable and can be used with pattern matching and destructuring.

```
[1 2 3]
```
```
let [a b c] = [10 20 30]..
```
```
case [10 20 30] of
  []: "empty"
  [x, rest]: add [x hd rest]  | Yields 30
end
```

### Records
Records are denoted with braces and space-separated bindings (commas are optional).
They are immutable and can be used with pattern matching and destructuring.
Keys are strings or identifiers.

```
{
  name: "Alice"
  age: 30
}
```

```
let hash = <{ name age }: concat [name age]>..
hash {name: "Alice" age: 30}
```

```
case {name: "Alice" age: 30} of
  {}: "empty record"
  {name}: "hello, ${name}"
  _: "no name given"
end
```

### Tags

Graffiticode supports symbolic values called tags. Tags are arity-0 symbolic constants used to represent fixed states or options.

A tag is any unbound identifier that is not defined by a let binding or built-in function.

Tags are case-sensitive—`Red` and `red` are distinct.

```
let status = Running..

case status of
  Running: "system is active"
  Stopped: "system is halted"
  Error: "system fault"
end
```

In this example, Running, Stopped, and Error are all tags. The compiler recognizes them as such because they are not bound by a let and are not built-in.

Tags are primarily used in pattern matching to define symbolic branches.

*Note: The existence of this feature subverts the detection of misspelled names
during parsing. Their detection is deferred to type checking when functions are
matched to their arguments.*

```
prnt "hello"..  | Error: "extra tokens after 'prnt'"
```

## Functions
### Lambda Functions
Lambdas are defined with angle brackets. The result of calling a function is the
value of final expression. The prefix of the body may be one or more `let`
definitions.

```
<x y: add x y>
```
```
<x y:
  let z = add x y..
  if gt z 0 then "positive" else "not positive"
>
```

### Function Application
Parentheses are required to suspend application, such as when using
functions as values. Parentheses may be used to wrap a complete function
application expression to enhance human readability.

### Currying
All functions support implicit currying. Function application with too few
arguments returns a partially applied function.

```
plus 1 2
```
```
filter (lt 3) [1 2 3 4 5]
```
```
map (double) [1 2 3]
```

### Recursion
Functions are recursive.

```
let factorial = <n: if eq n 1 then 1 else sub mul n factorial n 1>..
factorial 10..  | Yields 3628800
```

## Pattern Matching
Wildcard pattern: `_`. Supports list and record destructuring.

```
case x of
  pattern1: expr1
  pattern2: expr2
end
```

## Control Flow
### Conditional Expressions
Must include both `then` and `else`. Always returns a value.

```
if condition then expr1 else expr2
```

## Vocabulary

### Base

#### Print
```
print "hello, world!"..
```

#### String Concatenation

```
concat ["one" 2 "three"]  | Yields "one2three"
```

#### Arithmetic
`add`, `sub`, `mul`, `div`, `mod`

#### Comparison
`eq`, `ne`, `lt`, `le`, `gt`, `ge`

#### List Operations
`hd`, `tl`

`isEmpty`

`last`

`take n xs`, `drop n xs`, `nth n xs`

`filter`, `map`, `reduce`

`range start end step`

#### Record/List Access
Access to a member of a record or a list is through a string key and
number key, respectively.

```
get {name: "Alice", age: 30} "age"
```
```
set ["foo" "bar"] 2 "baz"  | Yields ["foo" "bar" "baz"]
```

### Dialect
- Dialects define the available built-ins for a given task
- Dialects are determined by the development environment

#### hello
Renders the text "hello, world!" in the view.

```json
{
  name: "hello",
  args: [
    string
  ]
}
```

```
hello "world"..
```

#### theme
Selects the given theme and renders the theme toggle in the view to allow the
user to change the theme.

```
{
  name: "theme",
  args: [
    [dark|light]
  ]
}
```
```
theme dark..
```
