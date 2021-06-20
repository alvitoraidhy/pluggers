/* eslint-disable import/prefer-default-export */
import semver from 'semver';

export const compareMetadata = (requiredMetadata: any, loadedMetadata: any): boolean => {
  // ref: https://medium.com/swlh/ways-to-compare-value-or-object-equality-in-javascript-71551c6f7cf6
  let result = true;
  const keys = Object.keys(requiredMetadata);
  for (let i = 0, len = keys.length; i < len; i += 1) {
    const k = keys[i];
    switch (k) {
      case 'version':
        // semver.satisfies(loadedVersion, requiredVersion)
        result = semver.satisfies(loadedMetadata[k], requiredMetadata[k]);
        break;
      default:
        if (typeof requiredMetadata[k] !== 'object') {
          result = requiredMetadata[k] === loadedMetadata[k];
        } else {
          result = compareMetadata(requiredMetadata[k], loadedMetadata[k]);
        }
        break;
    }

    if (result === false) break;
  }
  return result;
};
