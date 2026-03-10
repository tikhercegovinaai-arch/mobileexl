const babel = require('@babel/core');

const code = `
  const mode = import.meta.env ? import.meta.env.MODE : 'dev';
`;

const result = babel.transformSync(code, {
  plugins: [
    function () {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
              path.replaceWithSourceString('({ env: { MODE: process.env.NODE_ENV || "development" } })');
            }
          }
        }
      };
    }
  ]
});

console.log(result.code);
