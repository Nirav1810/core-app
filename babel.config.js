module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['import', { libraryName: '@ant-design/react-native' }],
    // Use the new plugin name as requested by the warning
    'react-native-worklets/plugin', 
  ],
};