/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

require('babel-polyfill');

const _ = require('lodash');
const path = require('path');
const dotenv = require('dotenv');

const configPostCss = path.resolve(__dirname, './');

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`
});

exports.onCreateWebpackConfig = ({
  actions, loaders
}) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.(s(a|c)ss|css)$/,
          loaders: [
            {
              loader: 'sass-resources-loader',
              options: {
                resources: path.resolve(__dirname, './src/nucleon/protons.scss')
              }
            }
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf|svg)$/,
          include: configPostCss,
          use: 'url-loader'
        },
        {
          test: /\.js$/,
          include: path.dirname(require.resolve('@weknow/gatsby-theme-markdown-boina')),
          use: [loaders.js()]
        }
      ]
    }
  });
};

exports.onCreateNode = ({
  node, actions, getNodes
}) => {
  if (node.internal.type === 'MarkdownRemark') {
    const { createNodeField } = actions;
    // Create a slug value as a field on the node.
    createNodeField({
      node,
      name: 'slug',
      value: node.frontmatter.path
    });

    // Create a content type field on the node.
    createNodeField({
      node,
      name: 'content_type',
      value: node.frontmatter.content_type
    });

    // Create a tags field on the node.
    createNodeField({
      node,
      name: 'tags',
      value: node.frontmatter.tags
    });
    /*
    const relatedNodes = node.frontmatter.related_post;
    console.log(relatedNodes); // eslint-disable-line
    const nodes = getNodes;
    relatedNodes.forEach((element) => {
      const relatedPosts = nodes.find(contentNode => (contentNode.internal.type === 'MarkdownRemark' && contentNode.frontmatter.related_post.includes(element)));
      console.log(relatedPosts); // eslint-disable-line
    });
    */
  }
};

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions;

  const articleTemplate = path.resolve(__dirname, './src/components/templates/article/index.js');
  const pageTemplate = path.resolve(__dirname, './src/components/templates/page/index.js');
  const tagsTemplate = path.resolve(__dirname, './src/components/templates/tags/index.js');

  return graphql(
    `
      {
        allMarkdownRemark(
          sort: { order: DESC, fields: [frontmatter___date] }
          limit: 2000
        ) {
          edges {
            node {
              html
              frontmatter {
                title
                path
                content_type
                tags {
                  id
                }
              }
              fields {
                slug
              }
            }
          }
        }
        allTagsYaml {
          edges {
            node {
              id
              url
            }
          }
        }
      }
    `
  ).then((result) => {
    if (result.errors) {
      reject(result.errors);
    }

    const posts = result.data.allMarkdownRemark.edges;
    const tags = result.data.allTagsYaml.edges;

    // create pages
    posts.forEach(({ node }) => {
      let template = pageTemplate;

      if (node.frontmatter.content_type === 'article') {
        template = articleTemplate;
      }
      createPage({
        path: node.fields.slug,
        component: template,
        context: {
          slug: node.fields.slug
        }
      });
    });

    // Make tag pages
    tags.forEach(({ node }) => {
      createPage({
        path: `/tags/${_.kebabCase(node.url)}/`,
        component: tagsTemplate,
        context: {
          tag: node.id
        }
      });
    });

    return null;
  });
};
