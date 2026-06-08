import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft,
  Lock,
  Phone,
  Plus,
  ScanLine,
  CardSim,
  Smartphone,
  SmartphoneCharging,
  User,
  Shield,
  Calendar,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput as PaperInput, Button as PaperButton, Switch as PaperSwitch, Chip as PaperChip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  RepairImagePairRow,
  RepairImageSlotCell,
} from '../components/RepairImageSlotRow';
import { useTheme } from '../context/ThemeContext';
import { getDirectoryCustomers, getRepairById, insertRepair, updateRepair } from '../db/database';
import { PatternDrawingModal, PatternPreview } from '../components/PatternDrawingModal';
import type { RootStackParamList } from '../navigation/types';
import type { DirectoryCustomer } from '../types/customer';
import type { AppColors } from '../theme';
import { accentAlpha, spacing } from '../theme';
import type { LockType, Repair, RepairImageSlot, RepairInput, RepairStatus } from '../types/repair';
import { LOCK_TYPES, REPAIR_STATUSES } from '../types/repair';
import { todayISODate } from '../utils/format';
import {
  emptyImageState,
  repairToImageState,
} from '../utils/repairImages';
import { resolveImagesForSaveCloud } from '../utils/repairImageUpload';
import {
  normalizeImeiInput,
  normalizePhoneInput,
  normalizeStoredImeiForDisplay,
  normalizeStoredPhoneForDisplay,
  sanitizeCustomerNameInput,
  validateRepairFormFields,
} from '../utils/repairValidation';
import { shareReceiptPdfToWhatsAppContact } from '../utils/receipt';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRepair'>;

const COMMON_PROBLEMS = [
  'Folder replace', 'Battery change', 'Charging issue', 'Network repair',
  'FRP lock', 'Software', 'Touch change', 'Speaker issue'
];

const DEVICE_BRANDS = [
  'Samsung', 'Apple', 'Xiaomi', 'Redmi', 'POCO', 'Realme', 'Oppo', 'Vivo',
  'OnePlus', 'Motorola', 'Nothing', 'Google Pixel', 'Nokia', 'IQOO',
  'Infinix', 'Tecno', 'Lava', 'Micromax', 'Asus', 'Sony', 'Huawei', 'Honor'
];

function parseMoney(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  const COLORS = {
    bg: colors.bg,
    card: colors.surface,
    border: colors.border,
    input: colors.surface2,
    primary: colors.accent,
    secondary: colors.accent,
    text: colors.text === '#0f172a' ? '#000000' : colors.text,
    subText: colors.textMuted,
  };
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingBottom: 140,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTextWrap: {
      marginLeft: 14,
    },
    headerTitle: {
      color: COLORS.text,
      fontSize: 22,
      fontWeight: '800',
    },
    sectionTitle: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 12,
      marginBottom: 6,
      marginHorizontal: 18,
      letterSpacing: 0.8,
    },
    orderBanner: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 14,
    },
    orderBannerLabel: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    orderBannerValue: {
      color: COLORS.primary,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    inputCard: {
      marginHorizontal: 18,
      marginBottom: 12,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      height: 38,
      paddingHorizontal: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputIcon: {
      width: 26,
      height: 26,
      borderRadius: 6,
      backgroundColor: '#0F1C32',
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputFieldWrap: {
      flex: 1,
      marginLeft: 8,
      height: '100%',
      justifyContent: 'center',
    },
    inputValue: {
      color: '#fff',
      fontSize: 13.5,
      fontWeight: '500',
      padding: 0,
      margin: 0,
      height: '100%',
    },
    imeiCard: {
      marginHorizontal: 18,
      marginTop: 12,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
    },
    imeiLabel: {
      color: COLORS.subText,
      fontSize: 13,
      marginBottom: 10,
    },
    imeiRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    imeiInputWrap: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      backgroundColor: COLORS.input,
      borderWidth: 1,
      borderColor: COLORS.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    imeiInput: {
      flex: 1,
      color: COLORS.text,
      fontSize: 13.5,
      padding: 0,
      margin: 0,
    },
    scanBtn: {
      width: 100,
      height: 38,
      borderRadius: 10,
      marginLeft: 10,
      overflow: 'hidden',
    },
    scanBtnInner: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    scanBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
      marginLeft: 4,
    },
    accessoryCard: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accessoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accessoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.input,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accessoryTitle: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 10,
    },
    accessoryToggle: {
      flexDirection: 'row',
      backgroundColor: COLORS.input,
      borderRadius: 12,
      padding: 3,
    },
    toggleBtn: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: 10,
    },
    toggleBtnActive: {
      backgroundColor: COLORS.primary,
      borderRadius: 10,
    },
    toggleText: {
      color: COLORS.subText,
      fontSize: 14,
      fontWeight: '700',
    },
    toggleTextActive: {
      color: '#fff',
    },
    problemCard: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
    },
    problemInput: {
      color: COLORS.text,
      fontSize: 14,
      minHeight: 40,
      textAlignVertical: 'top',
    },
    problemSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    suggestionChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: COLORS.input,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    suggestionChipText: {
      fontSize: 12,
      color: COLORS.subText,
      fontWeight: '600',
    },
    dateCard: {
      marginHorizontal: 18,
      marginBottom: 18,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      height: 38,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    dateValue: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '600',
    },
    doneDate: {
      alignSelf: 'flex-end',
      padding: 12,
      marginRight: 22,
    },
    doneDateText: {
      color: COLORS.primary,
      fontWeight: '700',
      fontSize: 14,
    },
    statusCard: {
      marginHorizontal: 18,
      marginBottom: 12,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.input,
    },
    statusChipActive: {
      borderColor: COLORS.primary,
      backgroundColor: accentAlpha(COLORS.primary, 0.15),
    },
    statusChipText: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '600',
    },
    statusChipTextActive: {
      color: COLORS.primary,
    },
    lockCard: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
    },
    lockHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lockTypeOptions: {
      flexDirection: 'row',
      backgroundColor: COLORS.input,
      borderRadius: 12,
      padding: 3,
      marginTop: 10,
    },
    lockTypeBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
    },
    lockInputContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    lockInputLabel: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    lockValueInput: {
      height: 38,
      borderRadius: 10,
      backgroundColor: COLORS.input,
      borderWidth: 1,
      borderColor: COLORS.border,
      color: COLORS.text,
      paddingHorizontal: 12,
      fontSize: 13.5,
    },
    patternBtnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    patternBtn: {
      flex: 1,
      height: 38,
      borderRadius: 10,
      backgroundColor: '#8B5CF6',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    patternBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
      marginLeft: 6,
    },
    paymentCard: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
    },
    paymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    paymentLabel: {
      color: COLORS.subText,
      fontSize: 13,
      fontWeight: '600',
    },
    paymentInput: {
      flex: 1,
      textAlign: 'right',
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      padding: 0,
      margin: 0,
    },
    paidRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    paidLabel: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '600',
    },
    toggle: {
      width: 40,
      height: 24,
      borderRadius: 12,
      backgroundColor: COLORS.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleOn: {
      backgroundColor: '#22C55E',
    },
    knob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
    },
    knobOn: {
      alignSelf: 'flex-end',
    },
    photosCard: {
      marginHorizontal: 18,
      marginBottom: 8,
    },
    photosHint: {
      color: COLORS.subText,
      fontSize: 12,
      marginBottom: 8,
      marginHorizontal: 18,
    },
    whatsappCard: {
      marginHorizontal: 18,
      marginBottom: 8,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    whatsappLabel: {
      color: COLORS.text,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    bottomBtn: {
      position: 'absolute',
      bottom: 16,
      left: 18,
      right: 18,
    },
    saveBtn: {
      height: 54,
      borderRadius: 16,
      overflow: 'hidden',
    },
    saveBtnInner: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
      marginLeft: 8,
    },
    saveBtnDisabled: {
      opacity: 0.7,
    },
    paperInput: {
      marginHorizontal: 18,
      marginBottom: 2,
      backgroundColor: COLORS.card,
    },
    imeiPaperInput: {
      flex: 1,
      backgroundColor: COLORS.card,
    },
    scanPaperBtn: {
      borderRadius: 12,
      justifyContent: 'center',
    },
    scanPaperBtnContent: {
      height: 42,
      paddingHorizontal: 8,
    },
    lockPaperInput: {
      marginTop: 3,
      backgroundColor: COLORS.card,
    },
    problemPaperInput: {
      backgroundColor: COLORS.card,
    },
    paymentPaperInput: {
      backgroundColor: COLORS.card,
    },
    savePaperBtn: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    savePaperBtnContent: {
      height: 50,
    },
    savePaperBtnLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    suggestionsContainer: {
      marginHorizontal: 18,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 14,
      marginTop: -6,
      marginBottom: 8,
      overflow: 'hidden',
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionName: {
      color: COLORS.text,
      fontWeight: '600',
      fontSize: 14,
    },
    suggestionPhone: {
      color: COLORS.subText,
      fontSize: 12,
    },
    brandSuggestContainer: {
      marginHorizontal: 18,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 14,
      marginTop: -6,
      marginBottom: 12,
      overflow: 'hidden',
      maxHeight: 200,
    },
  });
}

const ACCESSORY_UI = [
  { icon: CardSim, title: 'SIM tray', key: 'accSimTray' as const },
  { icon: SmartphoneCharging, title: 'Back cover', key: 'accBackCover' as const },
];

export function AddRepairScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const COLORS = useMemo(() => ({
    bg: colors.bg,
    card: colors.surface,
    border: colors.border,
    input: colors.surface2,
    primary: colors.accent,
    secondary: colors.accent,
    text: colors.text === '#0f172a' ? '#000000' : colors.text,
    subText: colors.textMuted,
  }), [colors]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const repairId = route.params?.repairId;
  const isEdit = repairId != null;

  const [loading, setLoading] = useState(!!isEdit);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [lockType, setLockType] = useState<LockType>('');
  const [lockValue, setLockValue] = useState('');
  const [isPatternModalVisible, setIsPatternModalVisible] = useState(false);
  const [problem, setProblem] = useState('');
  const [warranty, setWarranty] = useState('No Warranty');
  const [customWarranty, setCustomWarranty] = useState('');
  const [warrantyType, setWarrantyType] = useState<'none' | '30' | '90' | '180' | 'custom'>('none');
  const [dateReceived, setDateReceived] = useState(todayISODate());
  const [status, setStatus] = useState<RepairStatus>('pending');
  const [repairCost, setRepairCost] = useState('');
  const [expense, setExpense] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<Record<RepairImageSlot, string>>(() => emptyImageState());
  const initialImagesRef = useRef(emptyImageState());
  const [accessories, setAccessories] = useState<Pick<Repair, 'accSimTray' | 'accBackCover'>>({
    accSimTray: false,
    accBackCover: false,
  });
  const [orderCode, setOrderCode] = useState('');

  const [directoryCustomers, setDirectoryCustomers] = useState<DirectoryCustomer[]>([]);

  const [sendWhatsAppInvoice, setSendWhatsAppInvoice] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const loadDirectory = useCallback(async () => {
    try {
      const list = await getDirectoryCustomers();
      setDirectoryCustomers(list);
    } catch {
      setDirectoryCustomers([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit) void loadDirectory();
    }, [isEdit, loadDirectory])
  );

  // Track which scannedImei value we already processed to avoid re-runs
  const lastProcessedImeiRef = useRef<string | undefined>(undefined);
  // Track which prefillCustomer we already processed
  const lastProcessedCustomerRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const s = route.params?.scannedImei;
    if (s && s !== lastProcessedImeiRef.current) {
      lastProcessedImeiRef.current = s;
      setImei(normalizeImeiInput(s));
      // Only clear the param, don't touch other fields
      navigation.setParams({ scannedImei: undefined });
    }
  }, [route.params?.scannedImei, navigation]);

  useEffect(() => {
    const c = route.params?.prefillCustomer;
    if (!c || repairId != null) return;
    // Create a unique key from customer data to avoid re-processing
    const customerKey = `${c.customerName}-${c.phone}-${c.deviceModel}`;
    if (customerKey === lastProcessedCustomerRef.current) return;
    lastProcessedCustomerRef.current = customerKey;
    setCustomerName(sanitizeCustomerNameInput(c.customerName));
    setPhone(normalizeStoredPhoneForDisplay(c.phone));
    setDeviceModel(c.deviceModel);
    setImei('');
    setProblem('');
    void loadDirectory();
    navigation.setParams({ prefillCustomer: undefined });
  }, [route.params?.prefillCustomer, repairId, navigation, loadDirectory]);

  useEffect(() => {
    if (!repairId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await getRepairById(repairId);
      if (cancelled || !r) {
        setLoading(false);
        return;
      }
      setCustomerName(r.customerName);
      setPhone(normalizeStoredPhoneForDisplay(r.phone));
      setDeviceModel(r.deviceModel);
      setImei(normalizeStoredImeiForDisplay(r.imei ?? ''));
      setLockType((r.lockType as LockType) || '');
      setLockValue(r.lockValue || '');
      setProblem(r.problem);

      const w = r.warranty || 'No Warranty';
      setWarranty(w);
      if (w === 'No Warranty') {
        setWarrantyType('none');
      } else if (w === '30 Days') {
        setWarrantyType('30');
      } else if (w === '90 Days') {
        setWarrantyType('90');
      } else if (w === '180 Days') {
        setWarrantyType('180');
      } else {
        setWarrantyType('custom');
        setCustomWarranty(w);
      }

      setDateReceived(r.dateReceived);
      setStatus(r.status);
      setRepairCost(String(r.repairCost || ''));
      setExpense(String(r.expense || ''));
      setAdvanceAmount(String(r.advanceAmount || ''));
      setIsPaid(r.isPaid);
      const imgState = repairToImageState(r);
      initialImagesRef.current = imgState;
      setImages(imgState);
      setAccessories({
        accSimTray: r.accSimTray,
        accBackCover: r.accBackCover,
      });
      setOrderCode(r.orderCode);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [repairId]);

  const dateValue = new Date(dateReceived + 'T12:00:00');

  async function onSave() {
    const formErr = validateRepairFormFields({
      customerName,
      phone,
      deviceModel,
      problem,
      images,
    });
    if (formErr) {
      Alert.alert('Cannot save', formErr);
      return;
    }
    const name = customerName.trim();
    const ph = normalizePhoneInput(phone);
    const shouldAutoSendWhatsApp = !isEdit && sendWhatsAppInvoice;
    if (shouldAutoSendWhatsApp && ph.length !== 10) {
      Alert.alert('WhatsApp number', 'Enter a valid 10-digit WhatsApp number.');
      return;
    }
    setSaving(true);
    try {
      const base: RepairInput = {
        orderCode: orderCode || '',
        customerName: name,
        phone: ph,
        deviceModel: deviceModel.trim(),
        imei: normalizeImeiInput(imei),
        lockType,
        lockValue,
        problem: problem.trim(),
        warranty: warranty.trim(),
        dateReceived,
        status,
        repairCost: parseMoney(repairCost),
        expense: parseMoney(expense),
        advanceAmount: parseMoney(advanceAmount),
        isPaid,
        imagePhoneFront: '',
        imagePhoneBack: '',
        imageThumbnail: '',
        imageId1: '',
        imageId2: '',
        ...accessories,
      };
      let savedRepairId = repairId ?? 0;
      if (isEdit && repairId != null) {
        const resolved = await resolveImagesForSaveCloud(repairId, images, initialImagesRef.current);
        await updateRepair({ ...base, id: repairId, ...resolved });
        savedRepairId = repairId;
      } else {
        const newId = await insertRepair(base);
        const resolved = await resolveImagesForSaveCloud(newId, images, emptyImageState());
        await updateRepair({ ...base, id: newId, ...resolved });
        savedRepairId = newId;
      }

      if (shouldAutoSendWhatsApp) {
        try {
          const savedRepair = await getRepairById(savedRepairId);
          if (savedRepair) {
            await shareReceiptPdfToWhatsAppContact(savedRepair, ph);
          }
        } catch {
          Alert.alert(
            'WhatsApp',
            'Job saved, but could not open WhatsApp PDF share.'
          );
        }
      }
      navigation.goBack();
    } catch (err: any) {
      console.error('Error saving repair:', err);
      Alert.alert('Error saving', err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  function setImageSlot(slot: RepairImageSlot, uri: string) {
    setImages((prev) => ({ ...prev, [slot]: uri }));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Background gradient */}
      <LinearGradient
        colors={colors.bgGradient}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit job' : 'New job'}</Text>
          </View>
        </View>

        {isEdit && orderCode ? (
          <View style={styles.orderBanner}>
            <Text style={styles.orderBannerLabel}>Order ID</Text>
            <Text style={styles.orderBannerValue} selectable>{orderCode}</Text>
          </View>
        ) : null}

        {/* Customer Details */}
        <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>

        <View style={{ zIndex: 10 }}>
          <PaperInput
            label="Customer Name"
            placeholder="Enter customer name"
            value={customerName}
            onChangeText={(t) => {
              setCustomerName(sanitizeCustomerNameInput(t));
              setShowSuggestions(true);
            }}
            mode="outlined"
            dense={true}
            outlineColor={colors.border}
            activeOutlineColor={colors.accent}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            theme={{
              colors: {
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={styles.paperInput}
            left={<PaperInput.Icon icon={() => <User color={colors.accent} size={20} />} />}
          />
          {(!isEdit && showSuggestions && customerName.trim().length > 1) && (
            (() => {
              const q = customerName.trim().toLowerCase();
              const matches = directoryCustomers.filter(
                (c) => c.customerName.toLowerCase().includes(q) && c.customerName.toLowerCase() !== q
              );
              if (matches.length === 0) return null;
              return (
                <View style={styles.suggestionsContainer}>
                  {matches.slice(0, 3).map((c) => (
                    <Pressable
                      key={c.phone}
                      style={styles.suggestionItem}
                      android_ripple={{ color: colors.border }}
                      onPress={() => {
                        setCustomerName(sanitizeCustomerNameInput(c.customerName));
                        setPhone(normalizeStoredPhoneForDisplay(c.phone));
                        setShowSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionName}>{c.customerName}</Text>
                      <Text style={styles.suggestionPhone}>{c.phone}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })()
          )}
        </View>

        <PaperInput
          label="Phone Number"
          placeholder="Enter phone number"
          value={phone}
          onChangeText={(t) => setPhone(normalizePhoneInput(t))}
          keyboardType="number-pad"
          maxLength={10}
          mode="outlined"
          dense={true}
          outlineColor={colors.border}
          activeOutlineColor={colors.accent}
          textColor={colors.text}
          placeholderTextColor={colors.textMuted}
          theme={{
            colors: {
              background: colors.surface,
              placeholder: colors.textMuted,
            },
          }}
          style={styles.paperInput}
          left={<PaperInput.Icon icon={() => <Phone color={colors.accent} size={20} />} />}
        />



        {/* Device Details */}
        <Text style={styles.sectionTitle}>DEVICE DETAILS</Text>

        <View style={{ position: 'relative', zIndex: 9 }}>
          <PaperInput
            label="Device Model"
            placeholder="Enter device model"
            value={deviceModel}
            onChangeText={(t) => {
              setDeviceModel(t);
              setShowBrandDropdown(true);
            }}
            onFocus={() => setShowBrandDropdown(true)}
            mode="outlined"
            dense={true}
            outlineColor={colors.border}
            activeOutlineColor={colors.accent}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            theme={{
              colors: {
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={styles.paperInput}
            left={<PaperInput.Icon icon={() => <Smartphone color={colors.accent} size={20} />} />}
          />
          {showBrandDropdown && (
            (() => {
              const q = deviceModel.trim().toLowerCase();
              const matches = q.length === 0
                ? DEVICE_BRANDS
                : DEVICE_BRANDS.filter(b => b.toLowerCase().includes(q));
              if (matches.length === 0) return null;
              return (
                <View style={styles.brandSuggestContainer}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {matches.map((brand) => (
                      <Pressable
                        key={brand}
                        style={styles.suggestionItem}
                        android_ripple={{ color: colors.border }}
                        onPress={() => {
                          setDeviceModel(brand + ' ');
                          setShowBrandDropdown(false);
                        }}
                      >
                        <Text style={styles.suggestionName}>{brand}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              );
            })()
          )}
        </View>

        {/* IMEI */}
        <View style={{ marginHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
          <PaperInput
            label="IMEI (max 15 digits)"
            placeholder="Enter IMEI digits"
            value={imei}
            onChangeText={(t) => setImei(normalizeImeiInput(t))}
            keyboardType="number-pad"
            maxLength={15}
            mode="outlined"
            dense={true}
            outlineColor={colors.border}
            activeOutlineColor={colors.accent}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            theme={{
              colors: {
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={styles.imeiPaperInput}
          />
          <PaperButton
            mode="contained"
            onPress={() => navigation.navigate('ScanImei', { repairId: repairId ?? undefined })}
            style={[styles.scanPaperBtn, { marginTop: 3 }]}
            contentStyle={styles.scanPaperBtnContent}
            buttonColor={colors.accent}
            textColor="#FFFFFF"
            icon={() => <ScanLine color="#FFFFFF" size={18} />}
          >
            Scan
          </PaperButton>
        </View>

        {/* Device Lock */}
        <View style={styles.lockCard}>
          <View style={styles.lockHeaderRow}>
            <View style={styles.accessoryIcon}>
              <Lock color={COLORS.primary} size={22} />
            </View>
            <Text style={styles.accessoryTitle}>Device security lock</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {LOCK_TYPES.map((lt) => {
                const isSelected = lockType === lt.value;
                return (
                  <PaperChip
                    key={lt.value}
                    selected={isSelected}
                    mode="outlined"
                    showSelectedCheck={false}
                    onPress={() => {
                      setLockType(lt.value);
                      setLockValue('');
                    }}
                    style={{
                      backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                      borderColor: isSelected ? colors.accent : colors.border,
                      height: 32,
                    }}
                    textStyle={{
                      color: isSelected ? colors.accent : colors.textMuted,
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: 11,
                    }}
                  >
                    {lt.label}
                  </PaperChip>
                );
              })}
            </View>

            {/* Dynamic input depending on type */}
            {lockType === 'pattern' && (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <PaperButton
                  mode="contained"
                  onPress={() => setIsPatternModalVisible(true)}
                  style={[styles.scanPaperBtn, { flex: 1 }]}
                  contentStyle={{ height: 32, paddingHorizontal: 4 }}
                  labelStyle={{ fontSize: 11 }}
                  buttonColor={colors.accent}
                  textColor="#FFFFFF"
                  icon={() => <Lock color="#FFFFFF" size={12} />}
                >
                  {lockValue ? 'Redraw' : 'Draw'}
                </PaperButton>
                {lockValue ? (
                  <View style={{ padding: 2, backgroundColor: colors.surface2, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                    <PatternPreview path={lockValue} size={28} />
                  </View>
                ) : null}
              </View>
            )}

            {lockType === 'password' && (
              <View style={{ flex: 1 }}>
                <PaperInput
                  label="Password / PIN"
                  placeholder="Enter Password or PIN"
                  value={lockValue}
                  onChangeText={setLockValue}
                  keyboardType="default"
                  mode="outlined"
                  dense={true}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.accent}
                  textColor={colors.text}
                  placeholderTextColor={colors.textMuted}
                  theme={{
                    colors: {
                      background: colors.surface,
                      placeholder: colors.textMuted,
                    },
                  }}
                  style={[styles.lockPaperInput, { marginTop: 0 }]}
                />
              </View>
            )}
          </View>
        </View>

        <PatternDrawingModal
          visible={isPatternModalVisible}
          onClose={() => setIsPatternModalVisible(false)}
          onSave={setLockValue}
          initialPattern={lockValue}
        />

        {/* Problem */}
        <Text style={styles.sectionTitle}>PROBLEM / NOTES</Text>

        <View style={styles.problemCard}>
          <PaperInput
            label="Describe the issue..."
            placeholder="Describe the issue..."
            value={problem}
            onChangeText={setProblem}
            multiline
            numberOfLines={4}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.accent}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            theme={{
              colors: {
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={styles.problemPaperInput}
          />
          <View style={styles.problemSuggestions}>
            {COMMON_PROBLEMS.map((item) => (
              <PaperChip
                key={item}
                mode="outlined"
                onPress={() => {
                  setProblem(prev => {
                    const trimmed = prev.trim();
                    if (!trimmed) return item;
                    if (trimmed.toLowerCase().includes(item.toLowerCase())) return prev;
                    return `${trimmed}, ${item}`;
                  });
                }}
                style={{
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  marginRight: 2,
                  marginBottom: 2,
                }}
                textStyle={{
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                }}
              >
                {item}
              </PaperChip>
            ))}
          </View>
        </View>

        {/* Accessories */}
        <Text style={styles.sectionTitle}>ACCESSORIES (RECEIVED WITH DEVICE)</Text>

        {ACCESSORY_UI.map(({ icon: AccIcon, title, key }) => (
          <View key={key} style={styles.accessoryCard}>
            <View style={styles.accessoryLeft}>
              <View style={styles.accessoryIcon}>
                <AccIcon color={colors.accent} size={22} />
              </View>
              <Text style={styles.accessoryTitle}>{title}</Text>
            </View>
            <View style={styles.accessoryToggle}>
              <Pressable
                onPress={() => setAccessories((prev) => ({ ...prev, [key]: true }))}
                style={[styles.toggleBtn, accessories[key] && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, accessories[key] && styles.toggleTextActive]}>Yes</Text>
              </Pressable>
              <Pressable
                onPress={() => setAccessories((prev) => ({ ...prev, [key]: false }))}
                style={[styles.toggleBtn, !accessories[key] && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, !accessories[key] && styles.toggleTextActive]}>No</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Warranty */}
        <Text style={styles.sectionTitle}>WARRANTY PERIOD</Text>
        <View style={styles.lockCard}>
          <View style={styles.lockHeaderRow}>
            <View style={styles.accessoryIcon}>
              <Shield color={colors.accent} size={22} />
            </View>
            <Text style={styles.accessoryTitle}>Warranty coverage</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {[
              { label: 'None', type: 'none' as const, value: 'No Warranty' },
              { label: '30 Days', type: '30' as const, value: '30 Days' },
              { label: '90 Days', type: '90' as const, value: '90 Days' },
              { label: '180 Days', type: '180' as const, value: '180 Days' },
              { label: 'Custom', type: 'custom' as const, value: '' },
            ].map((opt) => {
              const isSelected = warrantyType === opt.type;
              return (
                <PaperChip
                  key={opt.type}
                  selected={isSelected}
                  mode="outlined"
                  showSelectedCheck={false}
                  onPress={() => {
                    setWarrantyType(opt.type);
                    if (opt.type !== 'custom') {
                      setWarranty(opt.value);
                    } else {
                      setWarranty(customWarranty);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                    borderColor: isSelected ? colors.accent : colors.border,
                  }}
                  textStyle={{
                    color: isSelected ? colors.accent : colors.textMuted,
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: 12,
                  }}
                >
                  {opt.label}
                </PaperChip>
              );
            })}
          </View>

          {warrantyType === 'custom' && (
            <View style={styles.lockInputContainer}>
              <PaperInput
                label="Custom warranty description"
                placeholder="e.g. 1 Year, 6 Months, Lifetime"
                value={customWarranty}
                onChangeText={(text) => {
                  setCustomWarranty(text);
                  setWarranty(text);
                }}
                mode="outlined"
                dense={true}
                outlineColor={colors.border}
                activeOutlineColor={colors.accent}
                textColor={colors.text}
                placeholderTextColor={colors.textMuted}
                theme={{
                  colors: {
                    background: colors.surface,
                    placeholder: colors.textMuted,
                  },
                }}
                style={styles.lockPaperInput}
              />
            </View>
          )}
        </View>

        {/* Photos */}
        <Text style={styles.sectionTitle}>DEVICE PHOTOS</Text>
        <View style={styles.photosCard}>
          <RepairImagePairRow>
            <RepairImageSlotCell
              label="Front *"
              uri={images.front}
              onChange={(uri) => setImageSlot('front', uri)}
            />
            <RepairImageSlotCell
              label="Back *"
              uri={images.back}
              onChange={(uri) => setImageSlot('back', uri)}
            />
            <RepairImageSlotCell
              label="ID 1"
              uri={images.id1}
              onChange={(uri) => setImageSlot('id1', uri)}
            />
            <RepairImageSlotCell
              label="ID 2"
              uri={images.id2}
              onChange={(uri) => setImageSlot('id2', uri)}
            />
          </RepairImagePairRow>
        </View>

        {/* Date */}
        <Text style={styles.sectionTitle}>DATE</Text>
        <Pressable onPress={() => setShowDate(true)}>
          <View pointerEvents="none">
            <PaperInput
              label="Date Received"
              value={dateReceived}
              editable={false}
              mode="outlined"
              dense={true}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  background: colors.surface,
                  placeholder: colors.textMuted,
                },
              }}
              style={styles.paperInput}
              right={<PaperInput.Icon icon={() => <Calendar color={colors.accent} size={20} />} />}
            />
          </View>
        </Pressable>
        {showDate && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              if (Platform.OS === 'android') setShowDate(false);
              if (d) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                setDateReceived(`${y}-${m}-${day}`);
              }
            }}
          />
        )}
        {Platform.OS === 'ios' && showDate && (
          <Pressable onPress={() => setShowDate(false)} style={styles.doneDate}>
            <Text style={styles.doneDateText}>Done</Text>
          </Pressable>
        )}

        {/* Status */}
        <Text style={styles.sectionTitle}>STATUS</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            {REPAIR_STATUSES.map((s) => {
              const isSelected = status === s.value;
              return (
                <PaperChip
                  key={s.value}
                  selected={isSelected}
                  mode="outlined"
                  showSelectedCheck={false}
                  onPress={() => setStatus(s.value)}
                  style={{
                    backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                    borderColor: isSelected ? colors.accent : colors.border,
                  }}
                  textStyle={{
                    color: isSelected ? colors.accent : colors.textMuted,
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: 12,
                  }}
                >
                  {s.label}
                </PaperChip>
              );
            })}
          </View>
        </View>

        {/* Payment */}
        <Text style={styles.sectionTitle}>PAYMENT</Text>
        <View style={styles.paymentCard}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PaperInput
              label="Repair cost (₹)"
              placeholder="0"
              value={repairCost}
              onChangeText={setRepairCost}
              keyboardType="decimal-pad"
              mode="outlined"
              dense={true}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  background: colors.surface,
                  placeholder: colors.textMuted,
                },
              }}
              style={[styles.paymentPaperInput, { flex: 1 }]}
            />
            <PaperInput
              label="Expense (₹)"
              placeholder="0"
              value={expense}
              onChangeText={setExpense}
              keyboardType="decimal-pad"
              mode="outlined"
              dense={true}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  background: colors.surface,
                  placeholder: colors.textMuted,
                },
              }}
              style={[styles.paymentPaperInput, { flex: 1 }]}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
            <PaperInput
              label="Advance amount (₹)"
              placeholder="0"
              value={advanceAmount}
              onChangeText={setAdvanceAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              dense={true}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  background: colors.surface,
                  placeholder: colors.textMuted,
                },
              }}
              style={[styles.paymentPaperInput, { flex: 1 }]}
            />
          </View>
          {isEdit && (
            <Pressable
              onPress={() => setIsPaid(!isPaid)}
              style={[styles.paidRow, { marginTop: 12 }]}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.paidLabel}>Marked as paid</Text>
              <PaperSwitch
                value={isPaid}
                onValueChange={setIsPaid}
                color={colors.success}
              />
            </Pressable>
          )}
        </View>

        {!isEdit ? (
          <Pressable
            onPress={() => setSendWhatsAppInvoice((v) => !v)}
            style={styles.whatsappCard}
            android_ripple={{ color: colors.border }}
          >
            <Text style={styles.whatsappLabel}>Send WhatsApp invoice PDF after save</Text>
            <PaperSwitch
              value={sendWhatsAppInvoice}
              onValueChange={setSendWhatsAppInvoice}
              color={colors.accent}
            />
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Bottom save button */}
      <View style={styles.bottomBtn}>
        <PaperButton
          mode="contained"
          onPress={() => {
            if (saving) return;
            void onSave();
          }}
          loading={saving}
          style={styles.savePaperBtn}
          contentStyle={styles.savePaperBtnContent}
          labelStyle={styles.savePaperBtnLabel}
          buttonColor={colors.accent}
          textColor="#FFFFFF"
          icon={saving ? undefined : () => <Plus color="#FFFFFF" size={20} />}
        >
          {saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Create job')}
        </PaperButton>
      </View>
    </SafeAreaView>
  );
}
