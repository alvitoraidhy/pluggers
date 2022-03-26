const fs = require("fs");
const path = require("path");

// ref: https://stackoverflow.com/a/40896897
exports.getDirectories = async (srcpath) => {
  const dirs = await fs.promises.readdir(srcpath);
  const filtered = dirs.filter((name) =>
    fs.statSync(path.join(srcpath, name)).isDirectory()
  );

  return filtered;
};

// ref: https://stackoverflow.com/a/40896897
exports.getFiles = async (srcpath) => {
  const files = await fs.promises.readdir(srcpath);
  const filtered = files.filter((name) =>
    fs.statSync(path.join(srcpath, name)).isFile()
  );

  return filtered;
};

// ref: https://stackoverflow.com/a/40896897
exports.getFilesRecursive = async (directoryName, result = []) => {
  const files = await fs.promises.readdir(directoryName);

  await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(directoryName, file);
      if (fs.statSync(path.join(fullPath)).isDirectory()) {
        await exports.getFilesRecursive(fullPath, result);
      } else {
        result.push(fullPath);
      }
    })
  );

  return result;
};
