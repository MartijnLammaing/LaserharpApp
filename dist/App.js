import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { init } from "./laserharp";
const image = { uri: 'https://cdn.instructables.com/ORIG/F5M/S4A9/INM7M0RS/F5MS4A9INM7M0RS.jpg?width=2100' };
export default function App() {
    init();
    return (React.createElement(View, { style: styles.container },
        React.createElement(ImageBackground, { source: image, resizeMode: "cover", style: styles.image },
            React.createElement(Text, { style: styles.text }, "Laserharp"))));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        flex: 1,
        justifyContent: 'center',
        width: '100%'
    },
    text: {
        color: 'white',
        fontSize: 42,
        lineHeight: 84,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
//# sourceMappingURL=App.js.map