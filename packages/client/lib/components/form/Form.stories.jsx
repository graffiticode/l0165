import { Form } from './Form';

export default {
  title: 'L0002',
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

export const Object = {
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

