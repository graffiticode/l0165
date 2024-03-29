import { Form } from './Form';

export default {
  title: 'Languages/L0001',
  component: Form,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

