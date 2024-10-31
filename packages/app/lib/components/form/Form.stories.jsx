import { Form } from './Form';

export default {
  title: 'L0151',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    state: {
      apply() {},
      data: {
        hello: "world",
      },
    },
  },
};

export const Dark = {
  args: {
    state: {
      apply({ type, args }) {
        console.log("apply() type=" + type + " args=" + JSON.stringify(args));
      },
      data: {
        theme: "dark",
        hello: "world",
      },
    },
  },
};

export const Light = {
  args: {
    state: {
      apply({ type, args }) {
        console.log("apply() type=" + type + " args=" + JSON.stringify(args));
      },
      data: {
        theme: "light",
        hello: "world",
      },
    },
  },
};

export const Json = {
  args: {
    state: {
      apply() {},
      data: {
        foo: 10,
        bar: "baz",
      },
    },
  },
};

