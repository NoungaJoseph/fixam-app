import React from 'react';
import { useAuth } from '../context/AuthContext';
import { createStackNavigator } from '@react-navigation/stack';
import AnimatedSplashScreen from '../screens/Auth/AnimatedSplashScreen';
import LanguageSelectionScreen from '../screens/Auth/LanguageSelectionScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ForgotPasswordOTPScreen from '../screens/Auth/ForgotPasswordOTPScreen';
import NewPasswordScreen from '../screens/Auth/NewPasswordScreen';
import PasswordSuccessScreen from '../screens/Auth/PasswordSuccessScreen';
import TermsPolicyScreen from '../screens/Auth/TermsPolicyScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { hasLoggedOut } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName={hasLoggedOut ? "Login" : "Splash"}
    >
      <Stack.Screen name="Splash" component={AnimatedSplashScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordOTP" component={ForgotPasswordOTPScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      <Stack.Screen name="PasswordSuccess" component={PasswordSuccessScreen} />
      <Stack.Screen name="TermsPolicy" component={TermsPolicyScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="TwoFactorLoginScreen" component={require('../screens/Auth/TwoFactorLoginScreen').default} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
