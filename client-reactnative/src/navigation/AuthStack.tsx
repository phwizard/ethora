import * as React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ROUTES} from '../constants/routes';
import LoginScreen from '../Screens/LoginScreen';
import {RegularLoginScreen} from '../Screens/RegularLoginScreen';
import {RegisterScreen} from '../Screens/RegisterScreen';
import {ResetPasswordScreen} from '../Screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        options={{headerShown: false, headerTitle: ''}}
        component={LoginScreen}
        name={ROUTES.LOGIN}
      />
      <Stack.Screen
        options={{headerShown: false, headerTitle: ''}}
        component={RegularLoginScreen}
        name={ROUTES.REGULARLOGIN}
      />
      <Stack.Screen
        options={{headerShown: false, headerTitle: ''}}
        component={RegisterScreen}
        name={ROUTES.REGISTER}
      />
      <Stack.Screen
        options={{headerShown: false, headerTitle: ''}}
        component={ResetPasswordScreen}
        name={ROUTES.RESETPASSWORD}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
