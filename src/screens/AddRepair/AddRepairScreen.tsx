import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import { customerService } from '../../services/customerService';
import { repairService } from '../../services/repairService';
import type { RootStackParamList } from '../../navigation/types';
import type { DirectoryCustomer } from '../../types/customer';
import type { LockType, RepairImageSlot } from '../../types/repair';
import type { WarrantyType } from './types';
import { emptyImageState, repairToImageState } from '../../utils/repairImages';
import {
  normalizeImeiInput,
  normalizeStoredImeiForDisplay,
  normalizeStoredPhoneForDisplay,
  sanitizeCustomerNameInput,
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

export function AddRepairScreen({ navigation, route }: Props) {
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createAddRepairStyles(colors), [colors]);

  const repairId = route.params?.repairId;
  const isEdit = repairId != null;

  const [loading, setLoading] = useState(!!isEdit);
  const [directoryCustomers, setDirectoryCustomers] = useState<DirectoryCustomer[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const initialImagesRef = useRef<Record<RepairImageSlot, string>>(emptyImageState());
  const lastProcessedImeiRef = useRef<string | undefined>(undefined);
  const lastProcessedCustomerRef = useRef<string | undefined>(undefined);

  const { state, setField, setAccessory, setImageSlot, setFormData } = useRepairForm();
  const { saving, saveRepair } = useRepairSave();

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
    void loadDirectory();
    navigation.setParams({ prefillCustomer: undefined });
  }, [route.params?.prefillCustomer, repairId, navigation, loadDirectory, setFormData]);

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
      onSuccess: () => navigation.goBack(),
    });
  }, [saveRepair, state, isEdit, repairId, navigation]);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
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

        <CustomerSection
          customerName={state.customerName}
          phone={state.phone}
          isEdit={isEdit}
          directoryCustomers={directoryCustomers}
          onChangeCustomerName={(val) => setField('customerName', val)}
          onChangePhone={(val) => setField('phone', val)}
          styles={styles}
          colors={colors}
        />

        <DeviceSection
          deviceModel={state.deviceModel}
          imei={state.imei}
          onChangeDeviceModel={(val) => setField('deviceModel', val)}
          onChangeImei={(val) => setField('imei', val)}
          onScanImei={() => navigation.navigate('ScanImei', { repairId: repairId ?? undefined })}
          styles={styles}
          colors={colors}
        />

        <ProblemSection
          problem={state.problem}
          onChangeProblem={(val) => setField('problem', val)}
          styles={styles}
          colors={colors}
        />

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

        <PhotosSection
          images={state.images}
          onChangeImageSlot={setImageSlot}
          styles={styles}
        />

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
