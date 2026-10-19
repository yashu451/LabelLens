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
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SocialButton } from '@/components/ui/SocialButton';
import { OrganicHeaderDecoration } from '@/components/ui/OrganicHeaderDecoration';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, mapFirebaseAuthError } from '@/config/firebase';

export default function LoginScreen() {
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & Auth Feedback State
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setAuthError(null);
    setSuccessMessage(null);

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

    return isValid;
  };

  const handleLogin = async () => {
    setAuthError(null);
    setSuccessMessage(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setIsSubmitting(false);
      // Navigate to existing Home Dashboard on successful authentication
      router.replace('/home');
    } catch (error: any) {
      setIsSubmitting(false);
      const errorCode = error?.code || '';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-email') {
        setEmailError(mapFirebaseAuthError(errorCode));
      } else if (errorCode === 'auth/wrong-password') {
        setPasswordError(mapFirebaseAuthError(errorCode));
      } else {
        setAuthError(mapFirebaseAuthError(errorCode, error?.message));
      }
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    // Quick development sign-in directly to Home Dashboard
    router.replace('/home');
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setSuccessMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Enter your email to receive password reset instructions');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSuccessMessage('Password reset link sent! Check your inbox.');
    } catch (error: any) {
      setAuthError(mapFirebaseAuthError(error?.code, error?.message));
    }
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
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue.</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {authError && (
              <View style={styles.alertBannerError}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.alertBannerTextError}>{authError}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.alertBannerSuccess}>
                <Feather name="check-circle" size={16} color="#15803D" />
                <Text style={styles.alertBannerTextSuccess}>{successMessage}</Text>
              </View>
            )}

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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxActive,
                  ]}
                >
                  {rememberMe && (
                    <Feather name="check" size={13} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <PrimaryButton
              title="Log In"
              onPress={handleLogin}
              loading={isSubmitting}
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <SocialButton
              type="google"
              onPress={() => handleSocialSignIn('google')}
            />
            <SocialButton
              type="apple"
              onPress={() => handleSocialSignIn('apple')}
            />

            {/* Registration Navigation Link */}
            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerLinkText}>
                Don't have an account?{' '}
                <Text
                  style={styles.signUpHighlight}
                  onPress={() => router.push('/register')}
                >
                  Sign Up
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
    paddingTop: 36,
    paddingBottom: 28,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
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
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 2,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.forestGreen,
    borderColor: Colors.forestGreen,
  },
  rememberMeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.forestGreen,
    fontWeight: '600',
  },
  loginButton: {
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
  signUpHighlight: {
    color: Colors.forestGreen,
    fontWeight: '700',
  },
  alertBannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  alertBannerTextError: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 18,
  },
  alertBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  alertBannerTextSuccess: {
    flex: 1,
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
    lineHeight: 18,
  },
});
