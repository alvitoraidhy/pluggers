import semver from "semver";

type Metadata = { version?: string; [key: string]: unknown };

export const compareMetadata = (
  requiredMetadata: Metadata,
  loadedMetadata: Metadata
): boolean => {
  // ref: https://medium.com/swlh/ways-to-compare-value-or-object-equality-in-javascript-71551c6f7cf6
  let result = true;
  const keys = Object.keys(requiredMetadata);
  for (let i = 0, len = keys.length; i < len; i += 1) {
    const k = keys[i];
    switch (k) {
      case "version":
        // semver.satisfies(loadedVersion, requiredVersion)
        result = semver.satisfies(
          loadedMetadata[k] as string,
          requiredMetadata[k] as string
        );
        break;
      default:
        if (typeof requiredMetadata[k] !== "object") {
          result = requiredMetadata[k] === loadedMetadata[k];
        } else {
          result = compareMetadata(
            requiredMetadata[k] as Metadata,
            loadedMetadata[k] as Metadata
          );
        }
        break;
    }

    if (result === false) break;
  }
  return result;
};

export default { compareMetadata };
