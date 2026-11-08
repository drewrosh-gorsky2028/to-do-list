import { Redirect } from 'expo-router';

// Any unknown address (for example when the web build is hosted under another path) opens Today.
export default function Unknown() {
  return <Redirect href="/" />;
}
