module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn'],
    semi: [2, 'never'], // WhY nO sEmi cOlon?? https://blog.izs.me/2010/12/an-open-letter-to-javascript-leaders-regarding
    'linebreak-style': 0,
  },
}
