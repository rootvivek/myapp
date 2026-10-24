import type { Repair } from '../types/repair';

describe('BuySell filtering and counting logic', () => {
  const sampleRepairs: Repair[] = [
    {
      id: 1,
      orderCode: 'ORD00001',
      transactionType: 'buy',
      customerName: 'Aarav Sharma',
      phone: '9876543210',
      deviceModel: 'iPhone 13 Pro',
      imei: '356789012345678',
      lockType: '',
      lockValue: '',
      problem: 'Buy Phone',
      warranty: 'No Warranty',
      dateReceived: '2026-10-18',
      status: 'completed',
      repairCost: 35000,
      expense: 0,
      advanceAmount: 0,
      isPaid: true,
      imagePhoneFront: '',
      imagePhoneBack: '',
      imageThumbnail: '',
      imageId1: '',
      imageId2: '',
      accSimTray: false,
      accBackCover: false,
      paymentType: 'cash',
      sellerId: null,
      createdBy: 'user1',
      createdByName: 'User',
      createdByRole: 'owner',
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 2,
      orderCode: 'ORD00002',
      transactionType: 'sell',
      customerName: 'Priya Singh',
      phone: '9812345678',
      deviceModel: 'Samsung S22',
      imei: '867890123456789',
      lockType: '',
      lockValue: '',
      problem: 'Sell Phone',
      warranty: '30 Days',
      dateReceived: '2026-10-18',
      status: 'pending',
      repairCost: 28000,
      expense: 0,
      advanceAmount: 0,
      isPaid: false,
      imagePhoneFront: '',
      imagePhoneBack: '',
      imageThumbnail: '',
      imageId1: '',
      imageId2: '',
      accSimTray: true,
      accBackCover: true,
      paymentType: 'online',
      sellerId: null,
      createdBy: 'user1',
      createdByName: 'User',
      createdByRole: 'owner',
      createdAt: '2026-10-18T11:00:00Z',
      updatedAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 3,
      orderCode: 'ORD00003',
      transactionType: undefined, // Regular repair job
      customerName: 'Rohan Patel',
      phone: '9823456789',
      deviceModel: 'OnePlus 11',
      imei: '123456789012345',
      lockType: '',
      lockValue: '',
      problem: 'Screen broken',
      warranty: 'No Warranty',
      dateReceived: '2026-10-18',
      status: 'pending',
      repairCost: 5000,
      expense: 2000,
      advanceAmount: 1000,
      isPaid: false,
      imagePhoneFront: '',
      imagePhoneBack: '',
      imageThumbnail: '',
      imageId1: '',
      imageId2: '',
      accSimTray: false,
      accBackCover: false,
      paymentType: 'cash',
      sellerId: null,
      createdBy: 'user1',
      createdByName: 'User',
      createdByRole: 'owner',
      createdAt: '2026-10-18T12:00:00Z',
      updatedAt: '2026-10-18T12:00:00Z',
    },
  ];

  it('filters out non-buy/sell repairs correctly', () => {
    const buySellEntries = sampleRepairs.filter(
      (r) => r.transactionType === 'buy' || r.transactionType === 'sell'
    );
    expect(buySellEntries.length).toBe(2);
    expect(buySellEntries.map((r) => r.id)).toEqual([1, 2]);
  });

  it('counts buy vs sell entries accurately', () => {
    const buySellEntries = sampleRepairs.filter(
      (r) => r.transactionType === 'buy' || r.transactionType === 'sell'
    );
    const countAll = buySellEntries.length;
    const countBuy = buySellEntries.filter((r) => r.transactionType === 'buy').length;
    const countSell = buySellEntries.filter((r) => r.transactionType === 'sell').length;

    expect(countAll).toBe(2);
    expect(countBuy).toBe(1);
    expect(countSell).toBe(1);
  });

  it('filters by category: buy only and sell only', () => {
    const buySellEntries = sampleRepairs.filter(
      (r) => r.transactionType === 'buy' || r.transactionType === 'sell'
    );
    const buyEntries = buySellEntries.filter((r) => r.transactionType === 'buy');
    const sellEntries = buySellEntries.filter((r) => r.transactionType === 'sell');

    expect(buyEntries.length).toBe(1);
    expect(buyEntries[0].deviceModel).toBe('iPhone 13 Pro');

    expect(sellEntries.length).toBe(1);
    expect(sellEntries[0].deviceModel).toBe('Samsung S22');
  });

  it('searches buy/sell entries by query (name, model, imei, orderCode)', () => {
    const buySellEntries = sampleRepairs.filter(
      (r) => r.transactionType === 'buy' || r.transactionType === 'sell'
    );

    const filterByQuery = (q: string) => {
      const lower = q.toLowerCase();
      return buySellEntries.filter(
        (r) =>
          r.customerName.toLowerCase().includes(lower) ||
          r.deviceModel.toLowerCase().includes(lower) ||
          r.imei.toLowerCase().includes(lower) ||
          r.orderCode.toLowerCase().includes(lower)
      );
    };

    expect(filterByQuery('iPhone').length).toBe(1);
    expect(filterByQuery('356789').length).toBe(1);
    expect(filterByQuery('Priya').length).toBe(1);
    expect(filterByQuery('ORD00002').length).toBe(1);
    expect(filterByQuery('NonExistent').length).toBe(0);
  });
});
