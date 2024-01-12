const colors = require('ansi-colors');
const cliProgress = require('cli-progress');
const glob = require('glob');
const { verifyImages, verifyMDX } = require('./verify-mdx');

const main = async () => {
  let filePaths = process.argv.slice(2);

  if (filePaths.length === 0) {
    // if user did not supply paths, default to all
    filePaths = glob.sync(
      `${__dirname}/../src{/content/**/*.mdx,/i18n/content/**/*.mdx}`
    );
  }

  verifyImages(filePaths);

  console.log(
    colors.greenBright(
      '\n\n🔍Reading MDX files. This may take a few moments... \n'
    )
  );
  progressBar.start(filePaths.length, 1);

  const results = await verifyMDX(filePaths, {
    onFileChecked: (_path, i) => progressBar.update(i + 1),
    onEnd: () => progressBar.stop(),
  });

  console.log(
    colors.magenta(`\n\nFailed MDX file count: `) + `${results.length}`
  );
  console.log(results);

  if (mdxErrors.length > 0) {
    console.log(colors.yellow(`\n\n❌ Found ${mdxErrors.length} MDX errors`));
    mdxErrors.forEach((error, i) =>
      console.error(colors.magenta(`\n\nError ${i + 1}: `) + `${error}`)
    );
    process.exitCode = 1;
  } else {
    console.log('\n\n🎉 No MDX issues found');
  }
};

const progressBar = new cliProgress.SingleBar(
  {
    format:
      // eslint-disable-next-line prefer-template
      'MDX verification progress |' +
      colors.cyan('{bar}') +
      '| {percentage}% || {value} of {total} Files',
    forceRedraw: true,
  },
  cliProgress.Presets.rect
);

main();
