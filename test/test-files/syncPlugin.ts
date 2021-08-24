import Plugger from "../../src/index";

export default (): Plugger => {
  const currentCwd = process.cwd();
  process.chdir(__dirname);
  const instance = Plugger.fromJsonFileSync();
  process.chdir(currentCwd);
  return instance;
};
