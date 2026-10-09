import { mockClient } from '../src/api/mock/mockClient';

describe('Guest Consultation Quota Enforcement (Critical Rule 7)', () => {
  const testDeviceId = 'test_device_quota_unit_1';

  it('initializes with 3 complimentary free questions', async () => {
    const quota = await mockClient.getGuestQuota(testDeviceId);
    expect(quota.remainingQueries).toBe(3);
    expect(quota.maxQueries).toBe(3);
    expect(quota.isLimitReached).toBe(false);
  });

  it('decrements quota sequentially with each question asked', async () => {
    // 1st query
    const afterFirst = await mockClient.useGuestQuery(testDeviceId);
    expect(afterFirst.remainingQueries).toBe(2);
    expect(afterFirst.isLimitReached).toBe(false);

    // 2nd query
    const afterSecond = await mockClient.useGuestQuery(testDeviceId);
    expect(afterSecond.remainingQueries).toBe(1);
    expect(afterSecond.isLimitReached).toBe(false);

    // 3rd query
    const afterThird = await mockClient.useGuestQuery(testDeviceId);
    expect(afterThird.remainingQueries).toBe(0);
    expect(afterThird.isLimitReached).toBe(true);
  });

  it('blocks further queries when quota reaches zero', async () => {
    // 4th query attempt
    const afterFourth = await mockClient.useGuestQuery(testDeviceId);
    expect(afterFourth.remainingQueries).toBe(0);
    expect(afterFourth.isLimitReached).toBe(true);
  });
});
