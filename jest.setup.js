/* global jest */
global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("react-native/Libraries/Modal/Modal", () => {
  const React = jest.requireActual("react");
  const View =
    jest.requireActual("react-native/Libraries/Components/View/View").default;

  function MockModal({ children, visible }) {
    return visible ? React.createElement(View, null, children) : null;
  }

  MockModal.displayName = "MockModal";
  return { __esModule: true, default: MockModal };
});
