import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SocialButton } from '@/components/ui/SocialButton';
import { OrganicHeaderDecoration } from '@/components/ui/OrganicHeaderDecoration';

export default function RegisterScreen() {
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation Errors
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Full Name check
    if (!fullName.trim()) {
      setFullNameError('Full name is required');
      isValid = false;
    } else if (fullName.trim().length < 2) {
      setFullNameError('Name must be at least 2 characters');
      isValid = false;
    }

    // Email check
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email address is required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Please enter a valid email address');
        isValid = false;
      }
    }

    // Password check
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // Confirm Password check
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Directly navigate to Home Dashboard
    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/home');
    }, 150);
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    // Quick development sign-in directly to Home Dashboard
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <OrganicHeaderDecoration />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LeafLogo size={42} color={Colors.forestGreen} />
            </View>
            <Text style={styles.appName}>LabelLens</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join us for healthier food choices.</Text>
          </View>

          {/* Registration Form Fields */}
          <View style={styles.formContainer}>
            <CustomInput
              iconName="user"
              placeholder="Full name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fullNameError) setFullNameError(null);
              }}
              autoCapitalize="words"
              error={fullNameError}
              returnKeyType="next"
            />

            <CustomInput
              iconName="mail"
              placeholder="Email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              returnKeyType="next"
            />

            <CustomInput
              iconName="lock"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              error={passwordError}
              returnKeyType="next"
            />

            <CustomInput
              iconName="lock"
              placeholder="Confirm password"
              isPassword
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError(null);
              }}
              error={confirmPasswordError}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {/* Primary Action Button */}
            <PrimaryButton
              title="Sign Up"
              onPress={handleRegister}
              loading={isSubmitting}
              style={styles.signUpButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Sign-Up */}
            <SocialButton
              type="google"
              onPress={() => handleSocialSignIn('google')}
            />
            <SocialButton
              type="apple"
              onPress={() => handleSocialSignIn('apple')}
            />

            {/* Login Navigation Link */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerLinkText}>
                Already have an account?{' '}
                <Text
                  style={styles.loginHighlight}
                  onPress={() => router.push('/login')}
                >
                  Log In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  signUpButton: {
    marginTop: 6,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  footerLinkContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  footerLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginHighlight: {
    color: Colors.forestGreen,
    fontWeight: '700',
  },
});
