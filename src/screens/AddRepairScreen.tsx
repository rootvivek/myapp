import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field } from '../components/Field';
import {
  RepairImagePairRow,
  RepairImagePairSpacer,
  RepairImageSlotCell,
} from '../components/RepairImageSlotRow';
import { YesNoRadioRow } from '../components/YesNoRadioRow';
import { useTheme } from '../context/ThemeContext';
import { getDirectoryCustomers, getRepairById, insertRepair, updateRepair } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { DirectoryCustomer } from '../types/customer';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import type { Repair, RepairImageSlot, RepairInput, RepairStatus } from '../types/repair';
import { ACCESSORY_ITEMS, REPAIR_STATUSES } from '../types/repair';
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
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.sm,
    },
    orderBanner: {
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    orderBannerLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    orderBannerValue: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    whatsappBlock: {
      marginBottom: spacing.md,
    },
    whatsappRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      backgroundColor: colors.surface2,
      paddingHorizontal: spacing.md,
    },
    whatsappLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
      marginRight: spacing.sm,
    },

    suggestionsContainer: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    suggestionItem: {
      padding: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionName: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    suggestionPhone: {
      color: colors.textMuted,
      fontSize: 13,
    },
    fieldLabel: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 6,
      fontWeight: '500',
    },
    imeiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    imeiInput: {
      flex: 1,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
    },
    scanBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.12),
    },
    scanBtnText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 15,
    },
    problemSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
      marginTop: -4,
    },
    problemSuggestionChip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
    },
    problemSuggestionText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    dateBtn: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    dateBtnText: {
      color: colors.text,
      fontSize: 16,
    },
    doneDate: {
      alignSelf: 'flex-end',
      padding: spacing.sm,
    },
    doneDateText: {
      color: colors.accent,
      fontWeight: '700',
    },
    multiline: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statusChip: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    statusChipActive: {
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.15),
    },
    statusChipText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    statusChipTextActive: {
      color: colors.accent,
    },
    paidRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    paidLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleOn: {
      backgroundColor: colors.success,
    },
    knob: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
    },
    knobOn: {
      alignSelf: 'flex-end',
    },
    saveBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.7,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },
  });
}

export function AddRepairScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const repairId = route.params?.repairId;
  const isEdit = repairId != null;

  const [loading, setLoading] = useState(!!isEdit);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [imei, setImei] = useState('');
  const [problem, setProblem] = useState('');
  const [dateReceived, setDateReceived] = useState(todayISODate());
  const [status, setStatus] = useState<RepairStatus>('pending');
  const [repairCost, setRepairCost] = useState('');
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

  useEffect(() => {
    const s = route.params?.scannedImei;
    if (s) {
      setImei(normalizeImeiInput(s));
      navigation.setParams({ scannedImei: undefined });
    }
  }, [route.params?.scannedImei, navigation]);

  useEffect(() => {
    const c = route.params?.prefillCustomer;
    if (!c || repairId != null) return;
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
      setProblem(r.problem);
      setDateReceived(r.dateReceived);
      setStatus(r.status);
      setRepairCost(String(r.repairCost || ''));
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
        problem: problem.trim(),
        dateReceived,
        status,
        repairCost: parseMoney(repairCost),
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isEdit && orderCode ? (
          <View style={styles.orderBanner}>
            <Text style={styles.orderBannerLabel}>Order ID</Text>
            <Text style={styles.orderBannerValue} selectable>
              {orderCode}
            </Text>
          </View>
        ) : null}


        <Text style={styles.section}>Customer & device</Text>
        <View style={{ zIndex: 10 }}>
          <Field
            label="Customer name *"
            value={customerName}
            onChangeText={(t) => {
              setCustomerName(sanitizeCustomerNameInput(t));
              setShowSuggestions(true);
            }}
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
        <Field
          label="Phone number * (10 digits)"
          value={phone}
          onChangeText={(t) => setPhone(normalizePhoneInput(t))}
          keyboardType="number-pad"
          maxLength={10}
        />
        {!isEdit ? (
          <View style={styles.whatsappBlock}>
            <Pressable
              onPress={() => setSendWhatsAppInvoice((v) => !v)}
              style={styles.whatsappRow}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.whatsappLabel}>Send WhatsApp invoice PDF after save</Text>
              <View style={[styles.toggle, sendWhatsAppInvoice && styles.toggleOn]}>
                <View style={[styles.knob, sendWhatsAppInvoice && styles.knobOn]} />
              </View>
            </Pressable>
          </View>
        ) : null}
        <View style={{ position: 'relative', zIndex: 9 }}>
          <Field
            label="Device model *"
            value={deviceModel}
            onChangeText={(t) => {
              setDeviceModel(t);
              setShowBrandDropdown(true);
            }}
            onFocus={() => setShowBrandDropdown(true)}
          />
          {showBrandDropdown && (
            (() => {
              const q = deviceModel.trim().toLowerCase();
              // Filter list based on query
              const matches = q.length === 0
                ? DEVICE_BRANDS
                : DEVICE_BRANDS.filter(b => b.toLowerCase().includes(q));

              // If user already exactly typed a brand + some more, close hint.
              // Or if no matches found.
              if (matches.length === 0) return null;

              return (
                <View style={[styles.suggestionsContainer, { maxHeight: 220 }]}>
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
        <Text style={styles.fieldLabel}>IMEI (max 15 digits)</Text>
        <View style={styles.imeiRow}>
          <TextInput
            placeholder="IMEI digits"
            placeholderTextColor={colors.textMuted}
            value={imei}
            onChangeText={(t) => setImei(normalizeImeiInput(t))}
            keyboardType="number-pad"
            maxLength={15}
            style={styles.imeiInput}
          />
          <Pressable
            onPress={() => navigation.navigate('ScanImei', { repairId: repairId ?? undefined })}
            style={styles.scanBtn}
            android_ripple={{ color: colors.border }}
          >
            <Text style={styles.scanBtnText}>Scan</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Accessories (received with device)</Text>
        <Text style={styles.hint}>Tap Yes or No for each item.</Text>
        {ACCESSORY_ITEMS.map(({ key, label }) => (
          <YesNoRadioRow
            key={key}
            label={label}
            value={accessories[key]}
            onChange={(yes) => setAccessories((prev) => ({ ...prev, [key]: yes }))}
          />
        ))}

        <Text style={styles.section}>Device photos</Text>
        <Text style={styles.hint}>Phone front, back, and thumbnail are required.</Text>
        <RepairImagePairRow>
          <RepairImageSlotCell
            label="Phone — front *"
            uri={images.front}
            onChange={(uri) => setImageSlot('front', uri)}
          />
          <RepairImageSlotCell
            label="Phone — back *"
            uri={images.back}
            onChange={(uri) => setImageSlot('back', uri)}
          />
        </RepairImagePairRow>
        <RepairImagePairRow>
          <RepairImageSlotCell
            label="Thumbnail *"
            uri={images.thumb}
            onChange={(uri) => setImageSlot('thumb', uri)}
          />
          <RepairImagePairSpacer />
        </RepairImagePairRow>
        <RepairImagePairRow>
          <RepairImageSlotCell
            label="ID / proof 1"
            uri={images.id1}
            onChange={(uri) => setImageSlot('id1', uri)}
          />
          <RepairImageSlotCell
            label="ID / proof 2"
            uri={images.id2}
            onChange={(uri) => setImageSlot('id2', uri)}
          />
        </RepairImagePairRow>

        <Text style={styles.section}>Job</Text>
        <Field
          label="Problem / notes *"
          value={problem}
          onChangeText={setProblem}
          multiline
          numberOfLines={4}
          style={styles.multiline}
        />
        <View style={styles.problemSuggestions}>
          {COMMON_PROBLEMS.map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setProblem(prev => {
                  const trimmed = prev.trim();
                  if (!trimmed) return item;
                  if (trimmed.toLowerCase().includes(item.toLowerCase())) return prev; // avoid dupes
                  return `${trimmed}, ${item}`;
                });
              }}
              style={styles.problemSuggestionChip}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.problemSuggestionText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Date received</Text>
        <Pressable
          onPress={() => setShowDate(true)}
          style={styles.dateBtn}
          android_ripple={{ color: colors.border }}
        >
          <Text style={styles.dateBtnText}>{dateReceived}</Text>
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

        <Text style={styles.section}>Status</Text>
        <View style={styles.statusRow}>
          {REPAIR_STATUSES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setStatus(s.value)}
              style={[styles.statusChip, status === s.value && styles.statusChipActive]}
            >
              <Text style={[styles.statusChipText, status === s.value && styles.statusChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Payment</Text>
        <Field
          label="Repair cost"
          value={repairCost}
          onChangeText={setRepairCost}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Field
          label="Advance amount"
          value={advanceAmount}
          onChangeText={setAdvanceAmount}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Pressable
          onPress={() => setIsPaid(!isPaid)}
          style={styles.paidRow}
          android_ripple={{ color: colors.border }}
        >
          <Text style={styles.paidLabel}>Marked as paid</Text>
          <View style={[styles.toggle, isPaid && styles.toggleOn]}>
            <View style={[styles.knob, isPaid && styles.knobOn]} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => void onSave()}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          android_ripple={{ color: '#fff' }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : 'Save job'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
