import { errorTypes } from "./constants";

class Base {
  /**
   * Contains custom error classes.
   *
   * @category Base
   */
  static errorTypes = errorTypes;

  /**
   * The metadata of the instance.
   *
   * @category Base
   */
  metadata = {} as { name: string; version?: string; [key: string]: unknown };

  /**
   * Returns the name of the instance that is stored in `instance.metadata.name`.
   *
   * @category Base
   * @returns The name of the instance.
   */
  getName(): string {
    return this.metadata.name;
  }
}

export default Base;
