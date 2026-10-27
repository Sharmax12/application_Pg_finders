module.exports = function (api) {
  api.cache.using(() => process.env.BABEL_ENV || process.env.NODE_ENV);
  const isTest =
    process.env.BABEL_ENV === 'test' || process.env.NODE_ENV === 'test';

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: isTest ? 'react' : 'nativewind' }],
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
  };
};
