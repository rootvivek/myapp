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

type CustomerEntryMode = 'new' | 'existing';

function parseMoney(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function createStyles(colors: AppColors) {
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
    orderHint: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.md,
      fontStyle: 'italic',
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    modeChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      alignItems: 'center',
    },
    modeChipOn: {
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.12),
    },
    modeChipText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 14,
    },
    modeChipTextOn: {
      color: colors.accent,
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
    directoryBlock: {
      marginBottom: spacing.md,
    },
    directoryHint: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    directorySearch: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
      marginBottom: spacing.sm,
    },
    directoryEmpty: {
      color: colors.textMuted,
      fontSize: 14,
      paddingVertical: spacing.sm,
    },
    directoryList: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
      maxHeight: 280,
    },
    directoryRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    directoryName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    directoryPhone: {
      color: colors.accent,
      fontSize: 14,
      marginTop: 2,
      fontWeight: '600',
    },
    directoryDevice: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
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
      paddingVertical: 12,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
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
  const [customerEntryMode, setCustomerEntryMode] = useState<CustomerEntryMode>('new');
  const [directoryCustomers, setDirectoryCustomers] = useState<DirectoryCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [sendWhatsAppInvoice, setSendWhatsAppInvoice] = useState(false);

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
    setCustomerEntryMode('existing');
    setCustomerName(sanitizeCustomerNameInput(c.customerName));
    setPhone(normalizeStoredPhoneForDisplay(c.phone));
    setDeviceModel(c.deviceModel);
    setImei('');
    setProblem('');
    setCustomerSearch('');
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
    const shouldAutoSendWhatsApp = !isEdit && customerEntryMode === 'new' && sendWhatsAppInvoice;
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

  function applyExistingCustomer(c: DirectoryCustomer) {
    setCustomerName(sanitizeCustomerNameInput(c.customerName));
    setPhone(normalizeStoredPhoneForDisplay(c.phone));
    setDeviceModel(c.deviceModel);
    setImei('');
    setProblem('');
    setCustomerSearch('');
    setSendWhatsAppInvoice(false);
  }

  const searchQ = customerSearch.trim().toLowerCase();
  const filteredDirectory =
    searchQ.length === 0
      ? directoryCustomers
      : directoryCustomers.filter(
          (c) =>
            c.customerName.toLowerCase().includes(searchQ) ||
            c.phone.replace(/\s/g, '').includes(searchQ.replace(/\s/g, ''))
        );

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
        ) : !isEdit ? (
          <Text style={styles.orderHint}>A unique order ID is assigned when you save this job.</Text>
        ) : null}

        {!isEdit ? (
          <>
            <Text style={styles.section}>Customer</Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => {
                  setCustomerEntryMode('new');
                  setCustomerSearch('');
                }}
                style={[styles.modeChip, customerEntryMode === 'new' && styles.modeChipOn]}
                android_ripple={{ color: colors.border }}
              >
                <Text style={[styles.modeChipText, customerEntryMode === 'new' && styles.modeChipTextOn]}>
                  New customer
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setCustomerEntryMode('existing');
                  void loadDirectory();
                  setSendWhatsAppInvoice(false);
                }}
                style={[styles.modeChip, customerEntryMode === 'existing' && styles.modeChipOn]}
                android_ripple={{ color: colors.border }}
              >
                <Text style={[styles.modeChipText, customerEntryMode === 'existing' && styles.modeChipTextOn]}>
                  Existing customer
                </Text>
              </Pressable>
            </View>
            {customerEntryMode === 'existing' ? (
              <View style={styles.directoryBlock}>
                <Text style={styles.directoryHint}>Choose a past customer. We fill name, phone, and last device; IMEI and problem start empty for this job.</Text>
                <TextInput
                  placeholder="Search name or phone…"
                  placeholderTextColor={colors.textMuted}
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  style={styles.directorySearch}
                  autoCorrect={false}
                />
                {directoryCustomers.length === 0 ? (
                  <Text style={styles.directoryEmpty}>No saved customers yet. Use &quot;New customer&quot; first.</Text>
                ) : filteredDirectory.length === 0 ? (
                  <Text style={styles.directoryEmpty}>No matches. Try another search or add a new customer.</Text>
                ) : (
                  <ScrollView
                    style={styles.directoryList}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredDirectory.slice(0, 50).map((c) => (
                      <Pressable
                        key={c.phone}
                        onPress={() => applyExistingCustomer(c)}
                        style={styles.directoryRow}
                        android_ripple={{ color: colors.border }}
                      >
                        <Text style={styles.directoryName} numberOfLines={1}>
                          {c.customerName}
                        </Text>
                        <Text style={styles.directoryPhone}>{c.phone}</Text>
                        {c.deviceModel ? (
                          <Text style={styles.directoryDevice} numberOfLines={1}>
                            Last device: {c.deviceModel}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.section}>Customer & device</Text>
        <Field
          label="Customer name *"
          value={customerName}
          onChangeText={(t) => setCustomerName(sanitizeCustomerNameInput(t))}
        />
        <Field
          label="Phone number * (10 digits)"
          value={phone}
          onChangeText={(t) => setPhone(normalizePhoneInput(t))}
          keyboardType="number-pad"
          maxLength={10}
        />
        {!isEdit && customerEntryMode === 'new' ? (
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
        <Field label="Device model *" value={deviceModel} onChangeText={setDeviceModel} />
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
