const visit = require('unist-util-visit');

const { getNodeText, isEmptyParagraph } = require('../../mdx-utils/mdxast');
const ERROR_TYPES = require('./error-types');

const validateSteps = (mdxAST) => {
  const errors = [];
  visit(mdxAST, (node) => {
    if (node.name !== 'Steps') {
      return;
    }
    const hasNonStepChild = node?.children?.some((el) => el.name !== 'Step');
    const nodeInfo = node.position.start;
    if (hasNonStepChild) {
      errors.push({
        ...nodeInfo,
        reason:
          '<Steps> component must only contain <Step> components as immediate children',
        type: ERROR_TYPES.VALIDATION_ERROR,
      });
    }
  });

  return errors;
};

const validateTabs = (mdxAST) => {
  const errors = [];
  visit(mdxAST, (node) => {
    if (node.name !== 'Tabs') return;

    const tabs = node;
    const nonTabChildren = tabs?.children?.filter(
      (el) =>
        el.name !== 'TabsBar' &&
        el.name !== 'TabsPages' &&
        !isEmptyParagraph(el)
    );
    nonTabChildren.map((el) => {
      const nodeInfo = el.position.start;
      const nodeDescriptor =
        el.name ?? el.type === 'paragraph' ? getNodeText(el) : el.type;
      errors.push({
        ...nodeInfo,
        reason: `<Tabs> component must only contain <TabsBar> and <TabsPages> as immediate children but found ${nodeDescriptor}`,
        type: ERROR_TYPES.VALIDATION_ERROR,
      });
    });

    let tabsBar = node.children.filter((el) => el.name === 'TabsBar');
    let tabsPages = node.children.filter((el) => el.name === 'TabsPages');

    if (tabsBar.length > 1) {
      const nodeInfo = tabsBar.position.start;
      errors.push({
        ...nodeInfo,
        reason: '<Tabs> can only have one <TabsBar> child',
        type: ERROR_TYPES.VALIDATION_ERROR,
      });
    }
    if (tabsPages.length > 1) {
      const nodeInfo = tabsPages.position.start;
      errors.push({
        ...nodeInfo,
        message: '<Tabs> can only have one <TabsPages> child',
        type: ERROR_TYPES.VALIDATION_ERROR,
      });
    }

    tabsBar = tabsBar[0];
    tabsPages = tabsPages[0];

    if (tabsBar == null || tabsPages == null) {
      if (tabsBar == null) {
        const nodeInfo = tabs.position.start;
        errors.push({
          ...nodeInfo,
          reason:
            'No <TabsBar> found! <Tabs> component must contain <TabsBar> as an immediate child',
          type: ERROR_TYPES.VALIDATION_ERROR,
        });
      }
      if (tabsPages == null) {
        const nodeInfo = tabs.position.start;
        errors.push({
          ...nodeInfo,
          reason:
            'No <TabsPages> found! <Tabs> component must contain <TabsPages> as an immediate child',
          type: ERROR_TYPES.VALIDATION_ERROR,
        });
      }

      return errors;
    }

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

module.exports = {
  validators: [validateSteps, validateTabs],
};
