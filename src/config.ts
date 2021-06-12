import dotenv from 'dotenv';
import fs from 'fs';
import lockfile from 'proper-lockfile';

class ConfigStore {
  path: string = '';

  storedObj: { [key: string]: string } = {};

  stagingObj: { [key: string]: string } = {};

  constructor(path: string) {
    this.path = path;

    fs.closeSync(fs.openSync(this.path, 'a'));

    this.refreshConfig();
  }

  lockConfigFile() {
    lockfile.lockSync(this.path);
    return this;
  }

  unlockConfigFile() {
    lockfile.unlockSync(this.path);
    return this;
  }

  getConfig() {
    return this.stagingObj;
  }

  getConfigFromFile() {
    this.lockConfigFile();
    const data = fs.readFileSync(this.path);
    this.unlockConfigFile();

    return dotenv.parse(data);
  }

  refreshConfig() {
    const data = this.getConfigFromFile();
    this.storedObj = { ...data };
    this.stagingObj = { ...data };

    return this;
  }

  storeConfig() {
    this.lockConfigFile();
    const fileObj = dotenv.parse(fs.readFileSync(this.path));

    // Get all updates on stored configurations object
    const diff = Object.keys(this.stagingObj).reduce((acc: { [key: string]: string }, e) => {
      if (this.stagingObj[e] !== this.storedObj[e]) acc[e] = this.stagingObj[e];
      return acc;
    }, {});

    // Merge updates with parsed configurations object from file
    const newObj = { ...fileObj, ...diff };

    // Remove deleted keys from parsed configuration object
    Object.keys(this.storedObj).forEach((key) => {
      if (
        !Object.prototype.hasOwnProperty.call(this.stagingObj, key)
        && Object.prototype.hasOwnProperty.call(newObj, key)
      ) {
        delete newObj[key];
      }
    });

    // Stringify object
    const envString = Object.keys(newObj).reduce((acc: string, e) => {
      const newAcc = `${acc}${e}="${newObj[e]}"\n`;
      return newAcc;
    }, '');

    // Store new object in env file
    fs.writeFileSync(this.path, envString);

    this.unlockConfigFile();
    this.storedObj = { ...newObj };
    this.stagingObj = { ...newObj };
    return this;
  }
}

export default ConfigStore;
