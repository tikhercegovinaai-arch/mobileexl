module.exports = function (api) {
  const platform = api.caller((caller) => caller && caller.platform) || process.env.EXPO_OS || 'web';
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      function ({ types: t }) {
        return {
          visitor: {
            MetaProperty(path) {
              if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
                path.replaceWithSourceString('({ env: { MODE: process.env.NODE_ENV || "development" }, url: "" })');
              }
            },
            MemberExpression(path) {
              if (
                t.isIdentifier(path.node.property, { name: 'EXPO_OS' }) &&
                t.isMemberExpression(path.node.object) &&
                t.isIdentifier(path.node.object.object, { name: 'process' }) &&
                t.isIdentifier(path.node.object.property, { name: 'env' })
              ) {
                path.replaceWith(t.stringLiteral(platform));
              }
            }
          }
        };
      }
    ]
  };
};
