import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { LeafLogo } from '@/components/ui/LeafLogo';
import { auth } from '@/config/firebase';
import { getUserPreferences, addUserScan } from '@/services/storage';
import {
  performOcrExtraction,
  evaluateHealthAndDiet,
  ExtractedLabelData,
  LabelAnalysisResult,
} from '@/services/ocr';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScreenStage = 'camera' | 'preview' | 'ocr_loading' | 'extracted' | 'analysis';

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    imageUri?: string;
    source?: 'camera' | 'gallery';
  }>();

  // Camera Reference & Permissions
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Photo Selection State
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
    params.imageUri || null
  );
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(
    params.source || null
  );

  // Workflow Stage State
  const [stage, setStage] = useState<ScreenStage>(
    params.imageUri ? 'preview' : 'camera'
  );

  // OCR Processing & Extracted State
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<{
    message: string;
    isBlurryOrUnreadable: boolean;
  } | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedLabelData | null>(null);
  const [showRawOcrText, setShowRawOcrText] = useState(false);

  // Analysis State
  const [analysisResult, setAnalysisResult] = useState<LabelAnalysisResult | null>(null);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);

  // Load user's dietary preferences from Firebase/AsyncStorage
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const prefs = await getUserPreferences(uid);
          setUserPreferences(prefs);
        } catch (e) {
          console.warn('[Scan] Failed to load preferences:', e);
        }
      }
    })();
  }, []);

  // Sync route params when navigating directly with a photo
  useEffect(() => {
    if (params.imageUri) {
      setSelectedImageUri(params.imageUri);
      setImageSource(params.source || 'camera');
      setStage('preview');
      setOcrError(null);
      setExtractedData(null);
      setAnalysisResult(null);
    }
  }, [params.imageUri, params.source]);

  /**
   * Handle Android activity destruction recovery
   * Recovers photo result if Android system killed app memory while picking from gallery
   */
  useEffect(() => {
    (async () => {
      try {
        const pendingResult = await ImagePicker.getPendingResultAsync();
        if (
          pendingResult &&
          'canceled' in pendingResult &&
          !pendingResult.canceled &&
          pendingResult.assets &&
          pendingResult.assets.length > 0
        ) {
          const asset = pendingResult.assets[0];
          setSelectedImageUri(asset.uri);
          setSelectedImageBase64(asset.base64 || null);
          setImageSource('gallery');
          setStage('preview');
          setOcrError(null);
          setExtractedData(null);
          setAnalysisResult(null);
        }
      } catch (err) {
        console.warn('Pending image picker result check in Scan:', err);
      }
    })();
  }, []);

  /**
   * Google Lens Capture Shutter:
   * Takes a live photo using expo-camera CameraView with base64 data
   */
  const handleCapturePhoto = async () => {
    if (isCapturing) return;
    if (!cameraRef.current) {
      setOcrError({
        message: 'Camera is not ready yet. Please wait a moment.',
        isBlurryOrUnreadable: false,
      });
      return;
    }

    try {
      setIsCapturing(true);
      setOcrError(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        base64: true,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setSelectedImageUri(photo.uri);
        setSelectedImageBase64(photo.base64 || null);
        setImageSource('camera');
        setStage('preview');
        setExtractedData(null);
        setAnalysisResult(null);
      }
    } catch (error: any) {
      console.warn('Camera capture error:', error);
      setOcrError({
        message: error?.message || 'Unable to capture photo. Please check permissions.',
        isBlurryOrUnreadable: false,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Gallery Picker inside the Camera Screen:
   * Opens the device image library with base64 data
   */
  const handlePickFromGallery = async () => {
    setOcrError(null);

    try {
      let libraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!libraryPermission.granted) {
        setOcrError({
          message: 'Gallery permission is required to select photos.',
          isBlurryOrUnreadable: false,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedImageBase64(asset.base64 || null);
        setImageSource('gallery');
        setStage('preview');
        setExtractedData(null);
        setAnalysisResult(null);
      }
    } catch (error: any) {
      console.warn('Gallery pick error:', error);
      setOcrError({
        message: error?.message || 'Unable to open photo gallery.',
        isBlurryOrUnreadable: false,
      });
    }
  };

  /**
   * Toggle camera facing (back <-> front)
   */
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  /**
   * Toggle flash mode (off <-> on)
   */
  const toggleFlash = () => {
    setFlash((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  /**
   * Retake Photo:
   * Clears current image and reopens the live Google Lens camera immediately
   */
  const handleRetake = () => {
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setImageSource(null);
    setOcrError(null);
    setExtractedData(null);
    setAnalysisResult(null);
    setIsOcrLoading(false);
    setStage('camera');
  };

  /**
   * Start Real OCR Text Extraction:
   * Calls OCR.space API and parses ingredients, nutrition facts, and allergens
   */
  const handleStartOcr = async () => {
    if (!selectedImageUri) return;

    setOcrError(null);
    setIsOcrLoading(true);
    setStage('ocr_loading');

    try {
      const result = await performOcrExtraction(selectedImageUri, selectedImageBase64);

      if (result.success && result.data) {
        setExtractedData(result.data);
        setOcrError(null);
        setStage('extracted');
      } else {
        setOcrError({
          message:
            result.errorMessage ||
            'The image appears blurry or text could not be extracted. Please retake the photo with good lighting and focus.',
          isBlurryOrUnreadable: result.isBlurryOrUnreadable ?? true,
        });
        setStage('preview');
      }
    } catch (err: any) {
      console.warn('OCR processing error:', err);
      setOcrError({
        message: err?.message || 'Failed to complete OCR extraction. Please try again.',
        isBlurryOrUnreadable: false,
      });
      setStage('preview');
    } finally {
      setIsOcrLoading(false);
    }
  };

  /**
   * Proceed to Food Label Analysis:
   * Calculates health score, checks user dietary preferences, and saves to history
   */
  const handleProceedToAnalysis = async () => {
    if (!extractedData) return;

    const analysis = evaluateHealthAndDiet(extractedData, userPreferences);
    setAnalysisResult(analysis);
    setStage('analysis');

    // Save scan to user history in storage
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const title =
          extractedData.productTitleGuess ||
          (extractedData.ingredients.length > 0
            ? `${extractedData.ingredients[0]} Label`
            : 'Food Label Scan');

        await addUserScan(uid, {
          name: title,
          brand: 'Scanned Food Label',
          status: `${analysis.ratingLabel} (${analysis.score}/100)`,
          statusType: analysis.score >= 70 ? 'success' : analysis.score >= 50 ? 'info' : 'warning',
          calories: extractedData.calories ? `${extractedData.calories} kcal` : undefined,
          score: analysis.score,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
      } catch (saveErr) {
        console.warn('Failed to save scan item to history:', saveErr);
      }
    }
  };

  /**
   * Open Device Settings if permission denied
   */
  const handleOpenSettings = () => {
    Linking.openSettings().catch(() => {
      setOcrError({
        message: 'Could not open device settings automatically.',
        isBlurryOrUnreadable: false,
      });
    });
  };

  // ==========================================
  // VIEW 1: LIVE GOOGLE LENS CAMERA SCREEN
  // ==========================================
  if (stage === 'camera' || !selectedImageUri) {
    if (!permission) {
      return (
        <SafeAreaView style={styles.cameraLoadingContainer}>
          <StatusBar style="light" />
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.cameraLoadingText}>Starting Camera...</Text>
        </SafeAreaView>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color={Colors.forestGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Food Label</Text>
            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.permissionContainer}>
            <View style={styles.permissionIconCircle}>
              <Feather name="camera-off" size={36} color={Colors.forestGreen} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSubtitle}>
              LabelLens needs camera permission to give you a Google Lens-style live scanning
              experience. You can also choose an existing label from your gallery.
            </Text>

            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionButtonText}>Enable Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handlePickFromGallery}
              activeOpacity={0.85}
            >
              <Feather name="image" size={18} color={Colors.forestGreen} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryActionButtonText}>Choose from Gallery Instead</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsLink}
              onPress={handleOpenSettings}
              activeOpacity={0.75}
            >
              <Text style={styles.settingsLinkText}>Open System Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraRoot}>
        <StatusBar style="light" />

        {/* Live Camera View */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={cameraFacing}
          flash={flash}
          mode="picture"
          onCameraReady={() => setIsCameraReady(true)}
        />

        <SafeAreaView style={styles.cameraOverlaySafeArea} pointerEvents="box-none">
          {/* Top Google Lens Bar: Back, Brand, Flash */}
          <View style={styles.topBarContainer}>
            <TouchableOpacity
              style={styles.topGlassButton}
              onPress={() => router.back()}
              activeOpacity={0.75}
              accessibilityLabel="Back to Home"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.topBrandBadge}>
              <LeafLogo size={18} color="#FFFFFF" />
              <Text style={styles.topBrandText}>LabelLens</Text>
            </View>

            <TouchableOpacity
              style={styles.topGlassButton}
              onPress={toggleFlash}
              activeOpacity={0.75}
              accessibilityLabel="Toggle flash"
            >
              <Ionicons
                name={flash === 'on' ? 'flash' : 'flash-off-outline'}
                size={20}
                color={flash === 'on' ? '#FBBF24' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* Center Viewfinder Frame (Google Lens Framing Brackets) */}
          <View style={styles.viewfinderContainer} pointerEvents="none">
            <View style={styles.viewfinderFrame}>
              <View style={[styles.cornerBracket, styles.topLeftBracket]} />
              <View style={[styles.cornerBracket, styles.topRightBracket]} />
              <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
              <View style={[styles.cornerBracket, styles.bottomRightBracket]} />
            </View>

            <View style={styles.hintPill}>
              <Ionicons name="scan-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.hintPillText}>Align nutrition facts or ingredients</Text>
            </View>
          </View>

          {/* Bottom Bar: Gallery Picker, Shutter Button, Flip Camera */}
          <View style={styles.bottomBarContainer}>
            <TouchableOpacity
              style={styles.sideControlBtn}
              onPress={handlePickFromGallery}
              activeOpacity={0.75}
              accessibilityLabel="Choose photo from gallery"
            >
              <View style={styles.sideControlCircle}>
                <Ionicons name="images" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.sideControlLabel}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shutterButtonOuter}
              onPress={handleCapturePhoto}
              disabled={isCapturing}
              activeOpacity={0.8}
              accessibilityLabel="Take Photo"
            >
              <View style={styles.shutterButtonInner}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color={Colors.forestGreen} />
                ) : (
                  <View style={styles.shutterCenterDot} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sideControlBtn}
              onPress={toggleCameraFacing}
              activeOpacity={0.75}
              accessibilityLabel="Flip camera"
            >
              <View style={styles.sideControlCircle}>
                <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.sideControlLabel}>Flip</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {ocrError && (
          <View style={styles.cameraToast}>
            <Feather name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.cameraToastText}>{ocrError.message}</Text>
          </View>
        )}
      </View>
    );
  }

  // ==========================================
  // VIEW 2: PHOTO PREVIEW / OCR LOADING / OCR ERROR
  // ==========================================
  if (stage === 'preview' || stage === 'ocr_loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleRetake}
            accessibilityLabel="Retake or return to camera"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Photo Preview</Text>

          <View style={styles.headerRightSpacer}>
            <TouchableOpacity onPress={handleRetake} activeOpacity={0.7}>
              <Text style={styles.resetButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Validation & Blurry Warning Banner */}
          {ocrError && (
            <View style={styles.alertBanner}>
              <View style={styles.alertIconCircle}>
                <Feather
                  name={ocrError.isBlurryOrUnreadable ? 'eye-off' : 'alert-circle'}
                  size={20}
                  color="#DC2626"
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {ocrError.isBlurryOrUnreadable
                    ? 'Label Unreadable or Blurry'
                    : 'Text Extraction Issue'}
                </Text>
                <Text style={styles.alertText}>{ocrError.message}</Text>
                <View style={styles.alertActionsRow}>
                  <TouchableOpacity
                    style={styles.alertActionBtn}
                    onPress={handleRetake}
                    activeOpacity={0.8}
                  >
                    <Feather name="refresh-cw" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.alertActionBtnText}>Retake Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.alertActionSecondaryBtn}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <Feather name="image" size={12} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.alertActionSecondaryBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Image Preview Frame */}
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <View style={styles.sourceTag}>
                <Feather
                  name={imageSource === 'camera' ? 'camera' : 'image'}
                  size={13}
                  color={Colors.forestGreen}
                />
                <Text style={styles.sourceTagText}>
                  {imageSource === 'camera' ? 'Captured with Camera' : 'Selected from Gallery'}
                </Text>
              </View>
              <Text style={styles.previewInstruction}>
                Verify that the nutrition facts table and ingredients list are sharp and readable.
              </Text>
            </View>

            <View style={styles.previewImageFrame}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              {/* OCR Processing Overlay */}
              {isOcrLoading && (
                <View style={styles.ocrLoadingOverlay}>
                  <View style={styles.ocrLoadingCard}>
                    <ActivityIndicator size="large" color={Colors.forestGreen} />
                    <Text style={styles.ocrLoadingTitle}>Extracting Food Label...</Text>
                    <Text style={styles.ocrLoadingSubtitle}>
                      Reading nutrition table, ingredients, and allergen declarations via OCR...
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonGroup}>
              {/* Primary Continue / Extract OCR Button */}
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  isOcrLoading && styles.actionButtonDisabled,
                ]}
                onPress={handleStartOcr}
                disabled={isOcrLoading}
                activeOpacity={0.85}
              >
                {isOcrLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : (
                  <Feather name="cpu" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.primaryActionButtonText}>
                  {isOcrLoading ? 'Extracting Text...' : 'Continue to OCR Extraction'}
                </Text>
              </TouchableOpacity>

              {/* Secondary Retake Button (Reopens Camera) */}
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handleRetake}
                disabled={isOcrLoading}
                activeOpacity={0.85}
              >
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={Colors.forestGreen}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryActionButtonText}>Retake Photo</Text>
              </TouchableOpacity>

              {/* Gallery Switcher */}
              <TouchableOpacity
                style={styles.alternativeSwitchBtn}
                onPress={handlePickFromGallery}
                disabled={isOcrLoading}
                activeOpacity={0.75}
              >
                <Feather
                  name="image"
                  size={15}
                  color={Colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.alternativeSwitchText}>Choose another photo from gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 3: EXTRACTED FOOD LABEL (OCR RESULTS)
  // ==========================================
  if (stage === 'extracted' && extractedData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStage('preview')}
            accessibilityLabel="Back to preview"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={24} color={Colors.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Extracted Label</Text>

          <View style={styles.headerRightSpacer}>
            <TouchableOpacity onPress={handleRetake} activeOpacity={0.7}>
              <Text style={styles.resetButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Extracted Header Card with Thumbnail & Status */}
          <View style={styles.extractedHeaderCard}>
            <View style={styles.extractedThumbWrapper}>
              <Image source={{ uri: selectedImageUri }} style={styles.extractedThumb} />
            </View>
            <View style={styles.extractedHeaderInfo}>
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={13} color="#166534" />
                <Text style={styles.verifiedBadgeText}>OCR Text Extracted</Text>
              </View>
              <Text style={styles.extractedProductTitle}>
                {extractedData.productTitleGuess || 'Packaged Food Label'}
              </Text>
              <Text style={styles.extractedSubtext}>
                {extractedData.nutrients.length} nutrients · {extractedData.ingredients.length} ingredients detected
              </Text>
            </View>
          </View>

          {/* 1. Nutrition Facts Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIconBadge}>
                <Feather name="activity" size={16} color={Colors.forestGreen} />
              </View>
              <View style={styles.sectionHeaderTitles}>
                <Text style={styles.sectionCardTitle}>Nutrition Facts</Text>
                {extractedData.servingSize && (
                  <Text style={styles.sectionCardSubtitle}>
                    Serving Size: {extractedData.servingSize}
                  </Text>
                )}
              </View>
              {extractedData.calories && (
                <View style={styles.calorieBadge}>
                  <Text style={styles.calorieBadgeNumber}>{extractedData.calories}</Text>
                  <Text style={styles.calorieBadgeLabel}>Calories</Text>
                </View>
              )}
            </View>

            {extractedData.nutrients.length > 0 ? (
              <View style={styles.nutrientTable}>
                {extractedData.nutrients.map((n, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.nutrientRow,
                      idx % 2 === 1 && styles.nutrientRowAlt,
                    ]}
                  >
                    <Text style={styles.nutrientName}>{n.name}</Text>
                    <View style={styles.nutrientAmountContainer}>
                      <Text style={styles.nutrientAmount}>{n.amount}</Text>
                      {n.dailyValue && (
                        <View style={styles.dvBadge}>
                          <Text style={styles.dvBadgeText}>{n.dailyValue} DV</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyNoticeText}>
                No standard nutrition panel detected in this photo section.
              </Text>
            )}
          </View>

          {/* 2. Detected Ingredients Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIconBadge}>
                <Feather name="list" size={16} color={Colors.forestGreen} />
              </View>
              <View style={styles.sectionHeaderTitles}>
                <Text style={styles.sectionCardTitle}>Ingredients List</Text>
                <Text style={styles.sectionCardSubtitle}>
                  {extractedData.ingredients.length > 0
                    ? `${extractedData.ingredients.length} ingredients recognized`
                    : 'Ingredients extracted from label'}
                </Text>
              </View>
            </View>

            {extractedData.ingredients.length > 0 ? (
              <View style={styles.ingredientsPillsWrap}>
                {extractedData.ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientPill}>
                    <Text style={styles.ingredientPillText}>{ing}</Text>
                  </View>
                ))}
              </View>
            ) : extractedData.rawIngredientsText ? (
              <Text style={styles.rawIngredientsBlock}>
                {extractedData.rawIngredientsText}
              </Text>
            ) : (
              <Text style={styles.emptyNoticeText}>
                No explicit ingredients list statement recognized.
              </Text>
            )}
          </View>

          {/* 3. Allergens Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="alert-triangle" size={16} color="#D97706" />
              </View>
              <View style={styles.sectionHeaderTitles}>
                <Text style={styles.sectionCardTitle}>Allergens & Warnings</Text>
                <Text style={styles.sectionCardSubtitle}>
                  {extractedData.allergens.length > 0
                    ? `${extractedData.allergens.length} declared allergen(s) found`
                    : 'No declared allergens identified'}
                </Text>
              </View>
            </View>

            {extractedData.allergens.length > 0 ? (
              <View style={styles.allergenBadgesWrap}>
                {extractedData.allergens.map((alg, idx) => (
                  <View key={idx} style={styles.allergenBadge}>
                    <Feather name="alert-circle" size={13} color="#B45309" />
                    <Text style={styles.allergenBadgeText}>{alg}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noAllergenRow}>
                <Feather name="check" size={16} color={Colors.forestGreen} />
                <Text style={styles.noAllergenText}>
                  No major common allergens detected in the scanned text.
                </Text>
              </View>
            )}
          </View>

          {/* 4. Verbatim Raw OCR Text (Expandable) */}
          <View style={styles.rawTextCard}>
            <TouchableOpacity
              style={styles.rawTextHeader}
              onPress={() => setShowRawOcrText(!showRawOcrText)}
              activeOpacity={0.7}
            >
              <Feather name="file-text" size={16} color={Colors.textSecondary} />
              <Text style={styles.rawTextTitle}>View Verbatim OCR Raw Text</Text>
              <Feather
                name={showRawOcrText ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {showRawOcrText && (
              <View style={styles.rawTextContent}>
                <Text style={styles.rawTextString}>{extractedData.rawText}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons: Proceed to Analysis or Retake */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleProceedToAnalysis}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionButtonText}>Proceed to Label Analysis</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handleRetake}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={16} color={Colors.forestGreen} style={{ marginRight: 8 }} />
              <Text style={styles.secondaryActionButtonText}>Scan Another Label</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // VIEW 4: LABEL ANALYSIS & HEALTH ASSESSMENT
  // ==========================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStage('extracted')}
          accessibilityLabel="Back to extracted label"
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={Colors.forestGreen} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Label Analysis</Text>

        <View style={styles.headerRightSpacer}>
          <TouchableOpacity onPress={handleRetake} activeOpacity={0.7}>
            <Text style={styles.resetButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {analysisResult && (
          <>
            {/* Score Card */}
            <View style={styles.scoreHeroCard}>
              <View
                style={[
                  styles.scoreRingCircle,
                  analysisResult.score >= 70
                    ? styles.scoreGreen
                    : analysisResult.score >= 50
                    ? styles.scoreYellow
                    : styles.scoreRed,
                ]}
              >
                <Text style={styles.scoreNumberText}>{analysisResult.score}</Text>
                <Text style={styles.scoreOutOfText}>/ 100</Text>
              </View>
              <Text style={styles.scoreRatingTitle}>{analysisResult.ratingLabel} Quality</Text>
              <Text style={styles.scoreSummaryText}>{analysisResult.summary}</Text>
            </View>

            {/* Highlights */}
            {analysisResult.highlights.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Feather name="thumbs-up" size={16} color="#15803D" />
                  </View>
                  <Text style={styles.sectionCardTitle}>Nutritional Highlights</Text>
                </View>
                {analysisResult.highlights.map((h, i) => (
                  <View key={i} style={styles.checkBulletRow}>
                    <Feather name="check" size={15} color="#15803D" style={{ marginTop: 2 }} />
                    <Text style={styles.checkBulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Concerns & Flags */}
            {analysisResult.concerns.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="alert-triangle" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.sectionCardTitle}>Nutrition Cautions</Text>
                </View>
                {analysisResult.concerns.map((c, i) => (
                  <View key={i} style={styles.cautionBulletRow}>
                    <Feather name="alert-circle" size={15} color="#DC2626" style={{ marginTop: 2 }} />
                    <Text style={styles.cautionBulletText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* User Dietary Preferences Compatibility */}
            {analysisResult.dietaryMatches.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Feather name="sliders" size={16} color="#0284C7" />
                  </View>
                  <Text style={styles.sectionCardTitle}>Your Dietary Preferences</Text>
                </View>
                {analysisResult.dietaryMatches.map((dm, i) => (
                  <View key={i} style={styles.dietaryRow}>
                    <Feather
                      name={dm.isCompliant ? 'check-circle' : 'x-circle'}
                      size={18}
                      color={dm.isCompliant ? '#15803D' : '#DC2626'}
                    />
                    <View style={styles.dietaryInfo}>
                      <Text style={styles.dietaryPrefName}>{dm.preference}</Text>
                      <Text
                        style={[
                          styles.dietaryReason,
                          !dm.isCompliant && styles.dietaryReasonNonCompliant,
                        ]}
                      >
                        {dm.reason}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleRetake}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionButtonText}>Scan Another Label</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => router.replace('/home')}
            activeOpacity={0.85}
          >
            <Feather name="home" size={18} color={Colors.forestGreen} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryActionButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Root & Base Layout
  safeArea: {
    flex: 1,
    backgroundColor: Colors.warmIvory,
  },
  cameraRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraOverlaySafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraLoadingContainer: {
    flex: 1,
    backgroundColor: '#0A150F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLoadingText: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Top Bar in Camera View
  topBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 12,
  },
  topGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBrandText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Viewfinder Overlay (Google Lens Brackets)
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderFrame: {
    width: SCREEN_WIDTH * 0.78,
    height: SCREEN_WIDTH * 0.95,
    maxWidth: 340,
    maxHeight: 420,
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  topLeftBracket: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRightBracket: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeftBracket: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRightBracket: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hintPillText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Bottom Bar Controls (Google Lens Style)
  bottomBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sideControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  sideControlCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  sideControlLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  shutterButtonOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shutterButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterCenterDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.forestGreen,
  },
  cameraToast: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraToastText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Permissions Fallback
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  settingsLink: {
    marginTop: 18,
    paddingVertical: 8,
  },
  settingsLinkText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Standard Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27, 67, 50, 0.06)',
    backgroundColor: Colors.warmIvory,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.forestGreen,
    letterSpacing: -0.3,
  },
  headerRightSpacer: {
    width: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  // Validation / Blurry Alert Banner
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    gap: 12,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 12,
  },
  alertActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  alertActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertActionSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionSecondaryBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },

  // Preview Layout
  previewContainer: {
    width: '100%',
  },
  previewHeader: {
    marginBottom: 16,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.leafGreen,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sourceTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  previewInstruction: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  previewImageFrame: {
    width: '100%',
    height: 360,
    backgroundColor: '#0F2018',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.12)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 22,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  ocrLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 21, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ocrLoadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  ocrLoadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.forestGreen,
    marginTop: 14,
    marginBottom: 6,
  },
  ocrLoadingSubtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButtonGroup: {
    gap: 12,
    marginTop: 6,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.forestGreen,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.forestGreen,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  secondaryActionButtonText: {
    color: Colors.forestGreen,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  alternativeSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  alternativeSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Extracted Label Layout
  extractedHeaderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
    alignItems: 'center',
    gap: 14,
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  extractedThumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F2018',
  },
  extractedThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  extractedHeaderInfo: {
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  extractedProductTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.forestGreen,
    marginBottom: 2,
  },
  extractedSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Structured Sections (Nutrition Facts, Ingredients, Allergens)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.leafGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderTitles: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.forestGreen,
  },
  sectionCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  calorieBadge: {
    backgroundColor: Colors.leafGreen,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  calorieBadgeNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.forestGreen,
  },
  calorieBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.forestGreen,
    textTransform: 'uppercase',
  },
  nutrientTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.06)',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  nutrientRowAlt: {
    backgroundColor: '#F8FAF9',
  },
  nutrientName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  nutrientAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutrientAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  dvBadge: {
    backgroundColor: 'rgba(27, 67, 50, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dvBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.forestGreen,
  },
  ingredientsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientPill: {
    backgroundColor: '#F4F7F5',
    borderWidth: 1,
    borderColor: '#E2EBE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ingredientPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rawIngredientsBlock: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  allergenBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  allergenBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  noAllergenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
  },
  noAllergenText: {
    fontSize: 12.5,
    color: '#15803D',
    fontWeight: '600',
  },
  emptyNoticeText: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 6,
  },

  // Raw OCR Text Accordion
  rawTextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  rawTextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  rawTextTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rawTextContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
    backgroundColor: '#FAFCFB',
  },
  rawTextString: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },

  // Analysis Result Screen
  scoreHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(27, 67, 50, 0.08)',
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  scoreRingCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 5,
  },
  scoreGreen: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  scoreYellow: {
    borderColor: '#EAB308',
    backgroundColor: '#FEFCE8',
  },
  scoreRed: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  scoreNumberText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.forestGreen,
  },
  scoreOutOfText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: -2,
  },
  scoreRatingTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.forestGreen,
    marginBottom: 4,
  },
  scoreSummaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  checkBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkBulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  cautionBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  cautionBulletText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 19,
  },
  dietaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F7F5',
  },
  dietaryInfo: {
    flex: 1,
  },
  dietaryPrefName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dietaryReason: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 1,
  },
  dietaryReasonNonCompliant: {
    color: '#DC2626',
  },
});
