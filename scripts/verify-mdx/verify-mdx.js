/* eslint-disable no-console */
const { frontmatter, validateFreshnessDate } = require('../utils/frontmatter');
const { verifyImageImports } = require('../utils/image-import-utils.js');
const mdx = require('@mdx-js/mdx');
const fs = require('fs');
const colors = require('ansi-colors');
const unified = require('unified');
const remarkParse = require('remark-parse');
const remarkMdx = require('remark-mdx');
const remarkMdxjs = require('remark-mdxjs');
const remarkStringify = require('remark-stringify');
const remarkFrontmatter = require('remark-frontmatter');

/**
 * Given an array of file paths, run our custom validators against the contents
 * and attempt to compile the MDX to JS for every file.
 *
 * @param {string[]} filePaths - the list of files to check
 * @param {object} options - lifecycle hooks for different stages of verifying

 */
const verifyMDX = async (filePaths, { onFileChecked, onEnd }) => {
  const allResults = await Promise.all(
    filePaths.map(async (path, i) => {
      const result = verifyFile(path);
      await onFileChecked(result, i);
      return result;
    })
  );
  await onEnd();

  const results = allResults.filter(Boolean);
  return results;
};

/**
 * Given an array of file paths, determine if any image imports are unused
 * or reference images that don't exist in the repo.
 */
const verifyImages = (filePaths) => {
  const imageErrors = verifyImageImports(filePaths);

  if (imageErrors.length > 0) {
    console.error(
      colors.yellow(`\n\n❌ Found ${imageErrors.length} image import errors`)
    );
    imageErrors.forEach((error, i) =>
      console.error(colors.magenta(`\n\nError ${i + 1}: `) + `${error}`)
    );
    console.error('\n\n-------------------------- ');
    process.exitCode = 1;
  } else {
    console.log('\n\n🎉 No image import issues found');
  }
};

const mdxErrors = [];

const createAST = (mdxText) => {
  const mdxAst = unified()
    .use(remarkParse)
    .use(remarkStringify, {
      bullet: '*',
      fences: true,
      listItemIndent: '1',
    })
    .use(remarkMdx)
    .use(remarkMdxjs)
    .use(remarkFrontmatter, ['yaml'])
    .parse(mdxText);

  return mdxAst;
};

const verifyFile = async (filePath) => {
  let failed = false;

  const mdxText = fs.readFileSync(filePath, 'utf8');
  try {
    const jsx = mdx.sync(mdxText);
    const mdxAst = createAST(mdxText);
    const { hasNonStepChild, nodeInfo } = verifyStepsChildren(mdxAst);
    const errors = verifyTabs(mdxAst);
    if (hasNonStepChild) {
      const customError = {
        reason:
          '<Steps> component must only contain <Step> components as immediate children',
        ...nodeInfo,
      };
      throw customError;
    }
  } catch (exception) {
    console.log(exception);
    mdxErrors.push(
      colors.magenta(` MDX error: `) +
        `${filePath} \n
      ${colors.red(exception.reason)}
    line: ${exception.line}
    column: ${exception.column}`
    );

    failed = true;
  }
  const excludeFromFreshnessRegex = [
    'src/content/docs/release-notes/',
    'src/content/whats-new/',
    'src/content/docs/style-guide/',
    'src/content/docs/security/new-relic-security/security-bulletins/',
    'src/i18n/content/',
  ];
  const shouldValidateFreshnessDate = !excludeFromFreshnessRegex.some(
    (excludedPath) => filePath.includes(excludedPath)
  );

  const { error } = frontmatter(mdxText);

  if (error != null) {
    mdxErrors.push(
      colors.magenta(` Frontmatter error: `) +
        `${filePath} \n
      ${colors.red(error.reason)}
    ${error.mark.snippet}`
    );
    failed = true;
  } else if (shouldValidateFreshnessDate) {
    const error = validateFreshnessDate(mdxText);
    if (error) {
      mdxErrors.push(
        colors.magenta(` Frontmatter field error: `) +
          `${filePath} \n
        ${colors.red(error.message)}`
      );
      failed = true;
    }
  }

  return failed ? filePath : null;
};

module.exports = {
  verifyImages,
  verifyMDX,
};
