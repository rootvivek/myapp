export function getWarrantyInfo(dateReceivedStr: string, warrantyStr: string) {
  const w = (warrantyStr || '').trim().toLowerCase();
  if (!w || w === 'no warranty' || w === 'none') {
    return { isWarranted: false, active: false, daysLeft: 0, label: 'No Warranty' };
  }

  const match = w.match(/\d+/);
  if (!match) {
    return { isWarranted: true, active: true, daysLeft: 0, label: warrantyStr };
  }

  const daysCount = parseInt(match[0], 10);
  if (Number.isNaN(daysCount) || daysCount <= 0) {
    return { isWarranted: false, active: false, daysLeft: 0, label: 'No Warranty' };
  }

  const startDate = new Date(dateReceivedStr + (dateReceivedStr.includes('T') ? '' : 'T12:00:00'));
  if (Number.isNaN(startDate.getTime())) {
    return { isWarranted: true, active: true, daysLeft: 0, label: warrantyStr };
  }

  const expiryDate = new Date(startDate.getTime() + daysCount * 24 * 60 * 60 * 1000);
  const now = new Date();

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isWarranted: true,
      active: true,
      daysLeft: diffDays,
      label: `Active (${diffDays} ${diffDays === 1 ? 'day' : 'days'} left)`,
    };
  }

  return {
    isWarranted: true,
    active: false,
    daysLeft: 0,
    label: 'Expired',
  };
}

export function matchPhone(phoneA: string, phoneB: string): boolean {
  const dA = (phoneA || '').replace(/\D/g, '');
  const dB = (phoneB || '').replace(/\D/g, '');
  if (!dA || !dB) return false;
  if (dA === dB) return true;
  const last10A = dA.length >= 10 ? dA.slice(-10) : dA;
  const last10B = dB.length >= 10 ? dB.slice(-10) : dB;
  return last10A === last10B;
}