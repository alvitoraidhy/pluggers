import Plugger from '../../index';

export default async () => {
  const currentCwd = process.cwd();
  process.chdir(__dirname);
  const instance = await Plugger.fromJsonFile();
  process.chdir(currentCwd);
  return instance;
};
