import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ChevronRight, Mail, Send, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!identifier) return Alert.alert('Error', 'Please enter email or mobile number');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { identifier });
      setStep(2);
      Alert.alert('Sent', 'A verification code has been sent to your registered device.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter verification code');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { identifier, otp });
      const { token, user } = res.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      navigation.navigate('Dashboard');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 p-8">
        <View className="mt-20 mb-16">
          <View className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 justify-center items-center mb-10 shadow-2xl shadow-indigo-200">
            <ShieldCheck size={40} color="white" />
          </View>
          <Text className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">Staff Login</Text>
          <Text className="text-base text-slate-500 mt-3 font-bold">
            {step === 1 ? 'Enter your details to receive a secure code' : 'Code sent! Please verify your identity'}
          </Text>
        </View>

        <View className="gap-6">
          {step === 1 ? (
            <>
              <View className="space-y-2">
                <Text className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">Email or Phone</Text>
                <View className="flex-row items-center bg-white rounded-3xl px-6 h-20 border border-slate-100 shadow-xl shadow-slate-200/50">
                  <Mail size={22} color="#4f46e5" />
                  <TextInput
                    className="flex-1 ml-4 text-lg font-bold text-slate-800"
                    placeholder="example@company.com"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="default"
                    autoCapitalize="none"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>
              </View>
              <TouchableOpacity
                className="bg-indigo-600 h-20 rounded-3xl flex-row justify-center items-center mt-4 shadow-2xl shadow-indigo-200 active:scale-95 transition-transform"
                onPress={handleSendOTP}
                disabled={loading}
              >
                <Text className="text-white text-lg font-bold mr-3">{loading ? 'Sending...' : 'Get Code'}</Text>
                <Send size={20} color="white" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="space-y-2">
                <Text className="text-[10px] font-bold text-slate-400 tracking-widest ml-1">7-Digit Code</Text>
                <View className="flex-row items-center bg-white rounded-3xl px-6 h-20 border border-slate-100 shadow-xl shadow-slate-200/50">
                  <ShieldCheck size={22} color="#4f46e5" />
                  <TextInput
                    className="flex-1 ml-4 text-2xl font-extrabold text-slate-900 tracking-[0.5em] text-center"
                    placeholder="0000000"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={7}
                    placeholderTextColor="#e2e8f0"
                  />
                </View>
              </View>
              <TouchableOpacity
                className="bg-indigo-600 h-20 rounded-3xl flex-row justify-center items-center mt-4 shadow-2xl shadow-indigo-200 active:scale-95 transition-transform"
                onPress={handleLogin}
                disabled={loading}
              >
                <Text className="text-white text-lg font-bold mr-3">{loading ? 'Verifying...' : 'Sign In'}</Text>
                <ChevronRight size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(1)} className="items-center mt-4 p-4">
                <Text className="text-slate-400 font-bold">Use different account</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="flex-row justify-center mt-auto mb-10 items-center">
          <Text className="text-slate-400 font-bold">Need help? </Text>
          <TouchableOpacity>
            <Text className="text-indigo-600 font-bold">Contact Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
