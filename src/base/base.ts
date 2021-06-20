import { errorTypes } from '../constants';

class Base {
  static errorTypes = errorTypes;

  metadata = {} as { name: string, version?: string, [key: string]: unknown };

  constructor(name?: string) {
    if (name) this.metadata.name = name;
  }
}

export default Base;
