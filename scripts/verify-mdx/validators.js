const visit = require('unist-util-visit');
const verifyStepsChildren = (mdxAST) => {
  const errors = [];
  visit(mdxAST, (node) => {
    if (node.name !== 'Steps') {
      return;
    }
    const hasNonStepChild = node?.children?.some((el) => el.name !== 'Step');
    const nodeInfo = node.position.start;
    if (hasNonStepChild) {
      errors.push({ hasNonStepChild, nodeInfo });
    }
  });
  return errors;
};

const verifyTabs = (mdxAST) => {
  const errors = [];
  visit(mdxAST, (node) => {
    if (node.name !== 'Tabs') return;

    const hasNonTabChild = node?.children?.some(
      (el) => el.name !== 'TabsBarItem' || el.name !== 'TabsPageItem'
    );
    if (hasNonTabChild) {
      const nodeInfo = node.position.start;
      errors.push({ hasNonTabChild, nodeInfo });
    }
    let tabsBar = node.children.filter((el) => el.name === 'TabsBar');
    let tabsPages = node.children.filter((el) => el.name === 'TabsPages');
    if (tabsBar.length > 1) {
      const nodeInfo = tabsBar.position.start;
      errors.push({
        message: 'Tabs can only have one `TabsBar` child',
        nodeInfo,
      });
    }
    if (tabsPages.length > 1) {
      const nodeInfo = tabsPages.position.start;
      errors.push({
        message: 'Tabs can only have one `TabsPages` child',
        nodeInfo,
      });
    }
    tabsBar = tabsBar[0];
    tabsPages = tabsPages[0];
    const barItems = tabsBar.children.filter((el) => el.name === 'TabsBarItem');
    const pageItems = tabsPages.children.filter(
      (el) => el.name === 'TabsPageItem'
    );

    console.log(
      'barItems',
      barItems.map((x) => x.attributes)
    );
    console.log(
      'pageItems',
      pageItems.map((x) => x.attributes)
    );
  });
  return errors;
};
