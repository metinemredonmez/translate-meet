module.exports = function (api) {
  const isTest = api.env('test');
  api.cache.using(() => isTest);
  // NativeWind's JSX transform is skipped under Jest: tests cover logic, not styling.
  return {
    presets: isTest
      ? ['babel-preset-expo']
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
