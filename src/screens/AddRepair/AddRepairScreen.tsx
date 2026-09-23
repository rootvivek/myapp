import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, StatusBar, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import { customerService } from '../../services/customerService';
import { repairService } from '../../services/repairService';
import type { RootStackParamList } from '../../navigation/types';
import type { DirectoryCustomer } from '../../types/customer';
import type { LockType, RepairImageSlot } from '../../types/repair';
import type { RepairFormState, WarrantyType } from './types';
import { emptyImageState, repairToImageState } from '../../utils/repairImages';
import {
  firstInvalidRepairField,
  isRepairFormField,
  normalizeImeiInput,
  normalizeStoredImeiForDisplay,
  normalizeStoredPhoneForDisplay,
  sanitizeCustomerNameInput,
  validateRepairFormField,
  type RepairFormErrors,
  type RepairFormField,
} from '../../utils/repairValidation';

import { AccessoriesSection } from './components/AccessoriesSection';
import { AddRepairPaymentModal } from './components/AddRepairPaymentModal';
import { CustomerSection } from './components/CustomerSection';
import { DateSection } from './components/DateSection';
import { DeviceSection } from './components/DeviceSection';
import { LockSection } from './components/LockSection';
import { PaymentSection } from './components/PaymentSection';
import { PhotosSection } from './components/PhotosSection';
import { ProblemSection } from './components/ProblemSection';
import { SaveButton } from './components/SaveButton';
import { StatusSection } from './components/StatusSection';
import { WarrantySection } from './components/WarrantySection';
import { useRepairForm } from './hooks/useRepairForm';
import { useRepairSave } from './hooks/useRepairSave';
import { createAddRepairStyles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AddRepair'>;

type FormSectionKey = 'customer' | 'device' | 'problem' | 'photos';

/** Which card holds each validatable field — used to scroll to the first error. */
const FIELD_SECTION: Record<RepairFormField, FormSectionKey> = {
  customerName: 'customer',
  phone: 'customer',
  deviceModel: 'device',
  problem: 'problem',
  imageFront: 'photos',
  imageBack: 'photos',
};

export function AddRepairScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createAddRepairStyles(colors), [colors]);

  const repairId = route.params?.repairId;
  const isEdit = repairId != null;

  const [loading, setLoading] = useState(!!isEdit);
  const [directoryCustomers, setDirectoryCustomers] = useState<DirectoryCustomer[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  /** Inline validation messages shown under each invalid input (no popup). */
  const [fieldErrors, setFieldErrors] = useState<RepairFormErrors>({});
  const formScrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Partial<Record<FormSectionKey, number>>>({});

  const initialImagesRef = useRef<Record<RepairImageSlot, string>>(emptyImageState());
  const lastProcessedImeiRef = useRef<string | undefined>(undefined);
  const lastProcessedCustomerRef = useRef<string | undefined>(undefined);

  const { state, setField, setAccessory, setImageSlot, setFormData } = useRepairForm();
  const { saving, saveRepair } = useRepairSave();

  const clearFieldError = useCallback((field: RepairFormField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * `setField` + re-validate that one field when it is already flagged, so the
   * red outline/message stay visible (focused or not) until the value is valid.
   */
  const updateField = useCallback(
    <K extends keyof RepairFormState>(field: K, value: RepairFormState[K]) => {
      setField(field, value);
      if (!isRepairFormField(field)) return;

      setFieldErrors((current) => {
        if (!current[field]) return current;

        const nextState = { ...state, [field]: value } as RepairFormState;
        const message = validateRepairFormField(field, {
          customerName: nextState.customerName,
          phone: nextState.phone,
          deviceModel: nextState.deviceModel,
          problem: nextState.problem,
          images: nextState.images,
        });

        if (message) return { ...current, [field]: message };

        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [setField, state]
  );

  /** Photos: keep the message until a photo is actually attached. */
  const updateImageSlot = useCallback(
    (slot: RepairImageSlot, uri: string) => {
      setImageSlot(slot, uri);
      if (!uri.trim()) return;
      if (slot === 'front') clearFieldError('imageFront');
      else if (slot === 'back') clearFieldError('imageBack');
    },
    [setImageSlot, clearFieldError]
  );

  const handleSectionLayout = useCallback(
    (key: FormSectionKey) => (event: LayoutChangeEvent) => {
      sectionOffsetsRef.current[key] = event.nativeEvent.layout.y;
    },
    []
  );

  const loadDirectory = useCallback(async () => {
    try {
      const list = await customerService.getDirectory();
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

  // Scanned IMEI param handling
  useEffect(() => {
    const s = route.params?.scannedImei;
    if (s && s !== lastProcessedImeiRef.current) {
      lastProcessedImeiRef.current = s;
      setField('imei', normalizeImeiInput(s));
      navigation.setParams({ scannedImei: undefined });
    }
  }, [route.params?.scannedImei, navigation, setField]);

  // Prefill Customer param handling
  useEffect(() => {
    const c = route.params?.prefillCustomer;
    if (!c || repairId != null) return;
    const customerKey = `${c.customerName}-${c.phone}-${c.deviceModel}`;
    if (customerKey === lastProcessedCustomerRef.current) return;
    lastProcessedCustomerRef.current = customerKey;

    setFormData({
      customerName: sanitizeCustomerNameInput(c.customerName),
      phone: normalizeStoredPhoneForDisplay(c.phone),
      deviceModel: c.deviceModel,
      imei: '',
      problem: '',
    });
    clearFieldError('customerName');
    clearFieldError('phone');
    clearFieldError('deviceModel');
    void loadDirectory();
    navigation.setParams({ prefillCustomer: undefined });
  }, [route.params?.prefillCustomer, repairId, navigation, loadDirectory, setFormData, clearFieldError]);

  // Edit Repair fetch
  useEffect(() => {
    if (!repairId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const r = await repairService.getById(repairId);
      if (cancelled || !r) {
        setLoading(false);
        return;
      }

      const w = r.warranty || 'No Warranty';
      let wType: WarrantyType = 'none';
      if (w === '30 Days') wType = '30';
      else if (w === '90 Days') wType = '90';
      else if (w === '180 Days') wType = '180';

      const imgState = repairToImageState(r);
      initialImagesRef.current = imgState;

      setFormData({
        customerName: r.customerName,
        phone: normalizeStoredPhoneForDisplay(r.phone),
        deviceModel: r.deviceModel,
        imei: normalizeStoredImeiForDisplay(r.imei ?? ''),
        lockType: (r.lockType as LockType) || '',
        lockValue: r.lockValue || '',
        problem: r.problem,
        warranty: w,
        warrantyType: wType,
        customWarranty: '',
        dateReceived: r.dateReceived,
        status: r.status,
        repairCost: String(r.repairCost || ''),
        expense: String(r.expense || ''),
        advanceAmount: String(r.advanceAmount || ''),
        isPaid: r.isPaid,
        paymentType: r.paymentType || 'cash',
        images: imgState,
        accessories: { accSimTray: r.accSimTray, accBackCover: r.accBackCover },
        orderCode: r.orderCode,
      });

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [repairId, setFormData]);

  const handleSave = useCallback(() => {
    void saveRepair(state, {
      isEdit,
      repairId: repairId ?? undefined,
      initialImagesRef,
      onValidationError: (errors) => {
        setFieldErrors(errors);
        const field = firstInvalidRepairField(errors);
        if (!field) return;
        const offset = sectionOffsetsRef.current[FIELD_SECTION[field]];
        if (typeof offset === 'number') {
          formScrollRef.current?.scrollTo({ y: Math.max(0, offset - 8), animated: true });
        }
      },
      onSuccess: () => navigation.goBack(),
    });
  }, [saveRepair, state, isEdit, repairId, navigation]);

  const handleBack = useCallback(() => {
    Alert.alert(
      isEdit ? 'Discard changes?' : 'Leave new job?',
      isEdit ? 'Your changes will not be saved.' : 'Your new job details will be lost.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
    return true;
  }, [isEdit, navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  const handleSelectDeliveredPaid = useCallback(
    (type: 'cash' | 'online') => {
      setFormData({ status: 'delivered', isPaid: true, paymentType: type });
      setPaymentModalVisible(false);
    },
    [setFormData]
  );

  const handleSelectDeliveredUnpaid = useCallback(() => {
    setFormData({ status: 'delivered', isPaid: false });
    setPaymentModalVisible(false);
  }, [setFormData]);

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
      <LinearGradient colors={colors.bgGradient} style={{ position: 'absolute', width: '100%', height: '100%' }} />

      <ScrollView ref={formScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft color={colors.text} size={24} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit job' : 'New job'}</Text>
          </View>
        </View>

        {isEdit && state.orderCode ? (
          <View style={styles.orderBanner}>
            <Text style={styles.orderBannerLabel}>Order ID</Text>
            <Text style={styles.orderBannerValue} selectable>{state.orderCode}</Text>
          </View>
        ) : null}

        <View onLayout={handleSectionLayout('customer')}>
          <CustomerSection
            customerName={state.customerName}
            phone={state.phone}
            isEdit={isEdit}
            directoryCustomers={directoryCustomers}
            errors={fieldErrors}
            onChangeCustomerName={(val) => updateField('customerName', val)}
            onChangePhone={(val) => updateField('phone', val)}
            styles={styles}
            colors={colors}
          />
        </View>

        <View onLayout={handleSectionLayout('device')}>
          <DeviceSection
            deviceModel={state.deviceModel}
            imei={state.imei}
            errors={fieldErrors}
            onChangeDeviceModel={(val) => updateField('deviceModel', val)}
            onChangeImei={(val) => updateField('imei', val)}
            onScanImei={() => navigation.navigate('ScanImei', { repairId: repairId ?? undefined })}
            styles={styles}
            colors={colors}
          />
        </View>

        <View onLayout={handleSectionLayout('problem')}>
          <ProblemSection
            problem={state.problem}
            errors={fieldErrors}
            onChangeProblem={(val) => updateField('problem', val)}
            currentExpense={state.expense}
            onChangeExpense={(val) => updateField('expense', val)}
            selectedInventoryItemIds={state.selectedInventoryItemIds}
            onAddInventoryItemId={(id) =>
              updateField('selectedInventoryItemIds', [...(state.selectedInventoryItemIds || []), id])
            }
            styles={styles}
            colors={colors}
          />
        </View>

        <AccessoriesSection
          accessories={state.accessories}
          onChangeAccessory={setAccessory}
          styles={styles}
          colors={colors}
        />

        <LockSection
          lockType={state.lockType}
          lockValue={state.lockValue}
          onChangeLockType={(val) => setField('lockType', val)}
          onChangeLockValue={(val) => setField('lockValue', val)}
          styles={styles}
          colors={colors}
        />

        <View onLayout={handleSectionLayout('photos')}>
          <PhotosSection
            images={state.images}
            errors={fieldErrors}
            onChangeImageSlot={updateImageSlot}
            styles={styles}
          />
        </View>

        <WarrantySection
          warranty={state.warranty}
          warrantyType={state.warrantyType}
          onChangeWarranty={(val) => setField('warranty', val)}
          onChangeWarrantyType={(val) => setField('warrantyType', val)}
          styles={styles}
          colors={colors}
        />

        <StatusSection
          status={state.status}
          onChangeStatus={(val) => setField('status', val)}
          isEdit={isEdit}
          styles={styles}
          colors={colors}
        />

        <PaymentSection
          repairCost={state.repairCost}
          expense={state.expense}
          advanceAmount={state.advanceAmount}
          isPaid={state.isPaid}
          paymentType={state.paymentType}
          sendWhatsAppInvoice={state.sendWhatsAppInvoice}
          isEdit={isEdit}
          onChangeRepairCost={(val) => setField('repairCost', val)}
          onChangeExpense={(val) => setField('expense', val)}
          onChangeAdvanceAmount={(val) => setField('advanceAmount', val)}
          onChangeIsPaid={(val) => setField('isPaid', val)}
          onChangePaymentType={(val) => setField('paymentType', val)}
          onChangeSendWhatsAppInvoice={(val) => setField('sendWhatsAppInvoice', val)}
          styles={styles}
          colors={colors}
        />

        <DateSection
          dateReceived={state.dateReceived}
          onChangeDateReceived={(val) => setField('dateReceived', val)}
          styles={styles}
          colors={colors}
        />
      </ScrollView>

      <SaveButton isEdit={isEdit} saving={saving} onSave={handleSave} styles={styles} colors={colors} />

      <AddRepairPaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelectDeliveredPaid={handleSelectDeliveredPaid}
        onSelectDeliveredUnpaid={handleSelectDeliveredUnpaid}
        deviceModel={state.deviceModel}
        customerName={state.customerName}
        styles={styles}
        colors={colors}
      />
    </SafeAreaView>
  );
}
