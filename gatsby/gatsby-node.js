import path from 'path';
import fetch from 'isomorphic-fetch';
import { allowedNodeEnvironmentFlags } from 'process';

async function turnPizzasIntoPages({ graphql, actions }) {
  // 1. Get a template for this page
  const pizzaTemplate = path.resolve('./src/templates/Pizza.js');
  // 2. Query all pizzas
  const { data } = await graphql(`
    query {
      pizzas: allSanityPizza {
        nodes {
          name
          slug {
            current
          }
        }
      }
    }
  `);
  // 3. Loop over each pizza and create a page for that pizza
  data.pizzas.nodes.forEach((pizza) => {
    actions.createPage({
      // What is the URL for this new page?
      path: `pizza/${pizza.slug.current}`,
      component: pizzaTemplate,
      context: {
        slug: pizza.slug.current,
      },
    });
  });
}

async function turnSlicemastersIntoSinglePage({ graphql, actions }) {
  // 1. Get a template for this page
  const slicemasterTemplate = path.resolve('./src/templates/Slicemaster.js');
  // 2. Query all Slicemasters
  const { data } = await graphql(`
    query {
      slicemasters: allSanityPerson {
        nodes {
          name
          description
          slug {
            current
          }
        }
      }
    }
  `);
  // 3. Loop over each Slicemaster and create a page
  data.slicemasters.nodes.forEach((slicemaster) => {
    console.log(`Creating page ${slicemaster.name}`);
    actions.createPage({
      // What is the URL for this new page?
      path: `slicemaster/${slicemaster.slug.current}`,
      component: slicemasterTemplate,
      context: {
        slug: slicemaster.slug.current,
      },
    });
  });
}

async function turnToppingsIntoPages({ graphql, actions }) {
  // 1. Get the template
  const toppingTemplate = path.resolve('./src/pages/pizzas.js');
  // 2. query all the toppings
  const { data } = await graphql(`
    query {
      toppings: allSanityTopping {
        nodes {
          name
          id
        }
      }
    }
  `);
  // 3. createPage for that topping
  data.toppings.nodes.forEach((topping) => {
    // console.log('Creating page for topping', topping.name);
    actions.createPage({
      path: `topping/${topping.name}`,
      component: toppingTemplate,
      // 4. Pass topping data to pizza.js
      context: {
        topping: topping.name,
        // TODO Regex for topping
        toppingRegex: `/${topping.name}/i`,
      },
    });
  });
}

async function fetchBeersAndTurnIntoNodes({
  actions,
  createNodeId,
  createContentDigest,
}) {
  // console.log('Turn beers into Nodes!');
  // 1. Fetch a list of beers
  const res = await fetch('https://sampleapis.com/beers/api/ale');
  const beers = await res.json();
  // console.log(beers);
  // 2. Loop over each one
  for (const beer of beers) {
    // create a node for each beer
    const nodeMeta = {
      id: createNodeId(`beer-${beer.name}`),
      parent: null,
      children: [],
      internal: {
        type: 'Beer',
        mediaType: 'application/json',
        contentDigest: createContentDigest(beer),
      },
    };
    actions.createNode({
      // 3. Create a node for that beer
      ...beer,
      ...nodeMeta,
    });
  }
}

async function turnSlicemastersIntoPages({ graphql, actions }) {
  // Query all slicemasters
  const { data } = await graphql(`
    query {
      slicemasters: allSanityPerson {
        totalCount
        nodes {
          name
          id
          slug {
            current
          }
        }
      }
    }
  `);
  // TODO: 2. Turn each slimaster into thir own page (TODO)
  // 3.Figure out how many pages there are based on how many slicemasters there are, and how many per page
  const pageSize = parseInt(process.env.GATSBY_PAGE_SIZE);
  const pageCount = Math.ceil(data.slicemasters.totalCount / pageSize);
  // console.log(
  //  `There are ${data.slicemasters.totalCount} total people. and we have ${pageCount} pages with ${pageSize} per page`
  // );
  // 4. Loop from 1 to n and create pages for then
  Array.from({ length: pageCount }).forEach((_, i) => {
    // console.log(`Creating page ${i}`);
    actions.createPage({
      path: `/slicemasters/${i + 1}`,
      component: path.resolve('./src/pages/slicemasters.js'),
      // This data is pass to the template whe we create it
      context: {
        skip: i * pageSize,
        currentPage: i + 1,
        pageSize,
      },
    });
  });
}

export async function sourceNodes(params) {
  // fetch a list of beers and source then into our gatsby API
  await Promise.all([fetchBeersAndTurnIntoNodes(params)]);
}

export async function createPages(params) {
  // Create pages dinamically
  // Wait for all promises to be resolved before finishing this function
  await Promise.all([
    // 1. pizzas
    await turnPizzasIntoPages(params),
    // 2. Toppings
    await turnToppingsIntoPages(params),
    // 3. Slicemasters)
    await turnSlicemastersIntoPages(params),
    await turnSlicemastersIntoSinglePage(params),
  ]);
}
