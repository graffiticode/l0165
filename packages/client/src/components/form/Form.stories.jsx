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
      apply({type, args}) {
      },
      data: {
        hello: "world",
        darkMode: false,
      },
    },
  },
};

