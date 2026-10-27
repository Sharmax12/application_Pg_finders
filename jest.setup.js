const jestGlobals = require("@jest/globals");

global.IS_REACT_ACT_ENVIRONMENT = true;

jestGlobals.jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jestGlobals.jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = jestGlobals.jest.requireActual("react");
  return { __esModule: true, default: React.Fragment };
});
