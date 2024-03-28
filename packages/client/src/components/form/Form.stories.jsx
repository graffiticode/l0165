import { Form } from './Form';

export default {
  title: 'Languages/L0001',
  component: Form,
  parameters: {
    layout: 'centered',
  },
};

export const Default = {
  args: {
    setHeight: () => {},
    state: {
      apply({type, args}) {
      },
      data: {
        "hello": "world",
      },
    },
  },
};

