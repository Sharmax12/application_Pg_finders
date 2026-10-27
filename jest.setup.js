import { jest as jestGlobals } from "@jest/globals";

global.IS_REACT_ACT_ENVIRONMENT = true;

jestGlobals.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jestGlobals.mock("react-native/Libraries/Modal/Modal", () => {
  const React = jestGlobals.requireActual("react");
  const PropTypes = jestGlobals.requireActual("prop-types");
  const View =
    jestGlobals.requireActual("react-native/Libraries/Components/View/View")
      .default;

  function MockModal({ children, visible }) {
    return visible ? React.createElement(View, null, children) : null;
  }

  MockModal.displayName = "MockModal";
  MockModal.propTypes = {
    children: PropTypes.node,
    visible: PropTypes.bool,
  };

  return { __esModule: true, default: MockModal };
});
