import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {

  const { isSignedIn , isLoaded } = useAuth();
  
  if (!isLoaded) {
    return (
      null
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(root)/(tabs)" />;
  }

  return <Redirect href="/sign-in" />;
}

