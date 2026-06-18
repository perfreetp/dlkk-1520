import Taro from '@tarojs/taro';

const STORAGE_PREFIX = 'teacher_cert_';

export const StorageKeys = {
  MATERIAL_CHECKED: STORAGE_PREFIX + 'material_checked',
  SUBMIT_CHECKED: STORAGE_PREFIX + 'submit_checked',
  PHOTOS: STORAGE_PREFIX + 'photos',
  NOTICES_READ: STORAGE_PREFIX + 'notices_read',
  NOTICES_HANDLED: STORAGE_PREFIX + 'notices_handled',
  APPLICANT_INFO: STORAGE_PREFIX + 'applicant_info'
};

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = Taro.getStorageSync(key);
    if (data === '' || data === null || data === undefined) {
      return defaultValue;
    }
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('[Storage] get error:', key, e);
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] set error:', key, e);
  }
}

export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(key);
  } catch (e) {
    console.warn('[Storage] remove error:', key, e);
  }
}
