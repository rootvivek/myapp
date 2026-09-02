import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* Period Selector */
  periodContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    height: 38,
  },
  periodScroll: {
    flex: 1,
  },
  periodScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: spacing.md,
    alignItems: 'center',
  },
  periodBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 32,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  customDateBtn: {
    flex: 1,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },

  /* KPI Stats */
  fullStatCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  fullStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fullStatValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  statSubText: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '600',
  },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* List */
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 110,
  },
  row: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  rowMain: {
    flex: 1,
    padding: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 11,
    fontWeight: '600',
  },
  device: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 3,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  costBreakdown: {
    fontSize: 12,
    fontWeight: '600',
  },
  unpaidBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  unpaidText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  paidText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  rowActions: {
    flexDirection: 'column',
    width: 46,
  },
  actionIconBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '600',
  },

  /* Edit Payment Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 16,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

