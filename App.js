import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './app/screens/HomeScreen';
import ResultScreen from './app/screens/ResultScreen';
import HistoryScreen from './app/screens/HistoryScreen';
import WebAnimations from './app/components/WebAnimations';

const Stack = createStackNavigator();

const PIXEL_COLORS = ['#c084fc', '#f472b6', '#a855f7', '#7c3aed'];

export default function App() {
  // Pixel trail cursor — web only
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function handleMouseMove(e) {
      const pixel = document.createElement('div');
      pixel.className = 'lumina-pixel';
      pixel.style.left = e.clientX - 3 + 'px';
      pixel.style.top = e.clientY - 3 + 'px';
      pixel.style.background = PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)];
      document.body.appendChild(pixel);
      // Remove after animation completes
      setTimeout(() => {
        if (pixel.parentNode) pixel.parentNode.removeChild(pixel);
      }, 520);
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {Platform.OS === 'web' && <WebAnimations />}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
