const path = require("path");
const fs = require("fs");
const promisify = require("util").promisify;
const exec = promisify(require("child_process").exec);

const TypeDoc = require("typedoc");
const ejs = require("ejs");
const rimraf = promisify(require("rimraf"));
const semver = require("semver");

const helpers = require("./helpers.cjs");

(async () => {
  // ##########################################
  // 0. Get all variables
  console.log("Getting all required variables...");
  const app = new TypeDoc.Application();

  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());
  app.bootstrap();

  const outDir = app.options.getValue("out");
  const docsDir = path.join(outDir, "v");
  const workDir = process.cwd();
  const templatesDir = path.join(__dirname, "templates");
  const packageVersion = require(path.join(workDir, "package.json")).version;

  console.log(`\
    'gh-pages' branch directory path: ${outDir}
    'gh-pages' docs directory path: ${docsDir}
    Working directory: ${workDir}
    EJS templates directory path: ${templatesDir}
    Package version: ${packageVersion}
  `);

  // ##########################################
  // 1. Mount "gh-pages" branch to "outDir" and pull updates
  console.log("Mounting 'gh-pages' branch and pulling updates...");
  await exec(`
    git worktree add ${outDir} gh-pages &&
    cd ${outDir} &&
    git pull;
  `);

  // ##########################################
  // 2. Render the current version docs
  console.log("Rendering documentations...");
  const project = app.convert();

  if (project) {
    // Rendered docs
    await app.generateDocs(project, path.join(docsDir, packageVersion));
  }

  // ##########################################
  // 3. Get a list of versions, grouped by their major numbers
  console.log("Reading all versions of documentation...");
  const docsVersions = await helpers.getDirectories(docsDir);

  const groupedVersions = {};
  docsVersions.forEach((ver) => {
    const verInstance = new semver.SemVer(ver);
    if (!groupedVersions[verInstance.major])
      groupedVersions[verInstance.major] = [];
    groupedVersions[verInstance.major].push(ver);
  });

  Object.keys(groupedVersions).forEach((x) => semver.rsort(groupedVersions[x]));

  // ##########################################
  // 4. Delete old versions (smaller minor or patch number)
  console.log("Removing old versions of documentation...");
  await Promise.all(
    Object.keys(groupedVersions).map((x) =>
      Promise.all(
        groupedVersions[x]
          .slice(1)
          .map((x) =>
            rimraf(path.join(docsDir, x)).then(console.log(`\tRemoved ${x}`))
          )
      )
    )
  );

  // ##########################################
  // 5. Render all templates
  console.log("Rendering EJS templates...");
  const files = await helpers.getFilesRecursive(templatesDir);

  const data = { versions: groupedVersions };

  await Promise.all(
    files
      .filter((x) => path.parse(x).ext === ".ejs")
      .map(async (file) => {
        const str = await promisify(ejs.renderFile)(file, data);

        const filename = `${path.parse(file).name}.html`;

        const outFilePath = path.join(outDir, filename);
        return await fs.promises
          .writeFile(outFilePath, str)
          .then(() => console.log(`Rendered file: ${file} -> ${outFilePath}`));
      })
  );

  // ##########################################
  // 6. Commit all changes
  console.log("Commiting changes to 'gh-pages'...");
  await exec(`
    cd ${outDir} &&
    git add . &&
    git commit -m "[ci skip] Update documentations for ${packageVersion}" &&
    git push;
  `);

  // ##########################################
  // 6. Commit all changes
  console.log("Unmounting 'gh-pages' branch...");
  await exec(`git worktree remove ${outDir}`);
})().catch(console.error);
