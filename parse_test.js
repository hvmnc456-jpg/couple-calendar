const babel = require('@babel/core');
const fs = require('fs');
const code = fs.readFileSync('C:/Users/user/temp_babel_check.js', 'utf8');
try {
  const result = babel.transform(code, {
    plugins: ['@babel/plugin-transform-react-jsx'],
    filename: 'test.jsx',
  });
  console.log('PARSE SUCCESS - code length:', result.code.length);
} catch(e) {
  console.error('PARSE ERROR:', e.message);
  if (e.loc) { console.error('Line:', e.loc.line, 'Col:', e.loc.column); }
}
