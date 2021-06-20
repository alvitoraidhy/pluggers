import Plugger from '../../index';

export default () => {
  const currentCwd = process.cwd();
  process.chdir(__dirname);
  const instance = Plugger.fromJsonFile();
  process.chdir(currentCwd);
  return instance;
};
