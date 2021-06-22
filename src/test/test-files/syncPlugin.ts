import Plugger from '../../index';

export default () => {
  const currentCwd = process.cwd();
  process.chdir(__dirname);
  const instance = Plugger.fromJsonFileSync();
  process.chdir(currentCwd);
  return instance;
};
