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

const ignore = process.env.NODE_ENV === "test" ? [] : ["**/*.test.js"];

module.exports = { presets, ignore };
