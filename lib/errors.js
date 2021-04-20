/* eslint-disable max-classes-per-file */
class RequirementError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequirementError';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

class NotLoadedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotLoadedError';
  }
}

module.exports = { RequirementError, ConflictError, NotLoadedError };
