import { AsyncPlugger } from '../../index';

export default async () => {
  const currentCwd = process.cwd();
  process.chdir(__dirname);
  const instance = await AsyncPlugger.fromJsonFile();
  process.chdir(currentCwd);
  return instance;
};
