const presets = [
  "@babel/preset-flow",
  [
    "@babel/preset-env",
    {
      targets: {
        node: "current",
      },
    },
  ],
];

const ignore = ["**/*.test.js"];

module.exports = { presets, ignore };
