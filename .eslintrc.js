module.exports = {
  extends: ["plugin:prettier/recommended", "plugin:flowtype/recommended"],
  plugins: ["flowtype"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        trailingComma: "all",
      },
    ],
  },
};
