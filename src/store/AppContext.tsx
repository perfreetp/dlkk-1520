import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StorageKeys, getStorage, setStorage } from '@/utils/storage';
import type { PhotoItem, ApplicantInfo } from '@/types';

interface AppState {
  materialChecked: string[];
  photos: PhotoItem[];
  noticesRead: string[];
  noticesHandled: string[];
  applicantInfo: ApplicantInfo;
}

interface AppContextValue extends AppState {
  toggleMaterialChecked: (id: string) => void;
  setMaterialCheckedList: (ids: string[]) => void;
  isMaterialChecked: (id: string) => boolean;
  addOrUpdatePhoto: (photo: PhotoItem) => void;
  removePhoto: (materialId: string) => void;
  setPhotos: (photos: PhotoItem[]) => void;
  isNoticeRead: (id: string) => boolean;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  isNoticeHandled: (id: string) => boolean;
  markNoticeHandled: (id: string) => void;
  setApplicantInfo: (info: Partial<ApplicantInfo>) => void;
}

const defaultApplicantInfo: ApplicantInfo = {
  name: '',
  idNumber: '',
  checkPassed: null
};

const defaultState: AppState = {
  materialChecked: [],
  photos: [],
  noticesRead: [],
  noticesHandled: [],
  applicantInfo: defaultApplicantInfo
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    materialChecked: getStorage<string[]>(StorageKeys.MATERIAL_CHECKED, []),
    photos: getStorage<PhotoItem[]>(StorageKeys.PHOTOS, []),
    noticesRead: getStorage<string[]>(StorageKeys.NOTICES_READ, []),
    noticesHandled: getStorage<string[]>(StorageKeys.NOTICES_HANDLED, []),
    applicantInfo: getStorage<ApplicantInfo>(StorageKeys.APPLICANT_INFO, defaultApplicantInfo)
  }));

  useEffect(() => {
    setStorage(StorageKeys.MATERIAL_CHECKED, state.materialChecked);
  }, [state.materialChecked]);

  useEffect(() => {
    setStorage(StorageKeys.PHOTOS, state.photos);
  }, [state.photos]);

  useEffect(() => {
    setStorage(StorageKeys.NOTICES_READ, state.noticesRead);
  }, [state.noticesRead]);

  useEffect(() => {
    setStorage(StorageKeys.NOTICES_HANDLED, state.noticesHandled);
  }, [state.noticesHandled]);

  useEffect(() => {
    setStorage(StorageKeys.APPLICANT_INFO, state.applicantInfo);
  }, [state.applicantInfo]);

  const toggleMaterialChecked = useCallback((id: string) => {
    setState(prev => {
      const exists = prev.materialChecked.includes(id);
      return {
        ...prev,
        materialChecked: exists
          ? prev.materialChecked.filter(i => i !== id)
          : [...prev.materialChecked, id]
      };
    });
  }, []);

  const setMaterialCheckedList = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, materialChecked: ids }));
  }, []);

  const isMaterialChecked = useCallback((id: string) => {
    return state.materialChecked.includes(id);
  }, [state.materialChecked]);

  const addOrUpdatePhoto = useCallback((photo: PhotoItem) => {
    setState(prev => {
      const filtered = prev.photos.filter(p => p.materialId !== photo.materialId);
      return { ...prev, photos: [...filtered, photo] };
    });
  }, []);

  const removePhoto = useCallback((materialId: string) => {
    setState(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.materialId !== materialId)
    }));
  }, []);

  const setPhotos = useCallback((photos: PhotoItem[]) => {
    setState(prev => ({ ...prev, photos }));
  }, []);

  const isNoticeRead = useCallback((id: string) => {
    return state.noticesRead.includes(id);
  }, [state.noticesRead]);

  const markNoticeRead = useCallback((id: string) => {
    setState(prev => {
      if (prev.noticesRead.includes(id)) return prev;
      return { ...prev, noticesRead: [...prev.noticesRead, id] };
    });
  }, []);

  const markAllNoticesRead = useCallback(() => {
    setState(prev => ({ ...prev, noticesRead: ['n1', 'n2', 'n3', 'n4'] }));
  }, []);

  const isNoticeHandled = useCallback((id: string) => {
    return state.noticesHandled.includes(id);
  }, [state.noticesHandled]);

  const markNoticeHandled = useCallback((id: string) => {
    setState(prev => {
      if (prev.noticesHandled.includes(id)) return prev;
      return { ...prev, noticesHandled: [...prev.noticesHandled, id] };
    });
  }, []);

  const setApplicantInfo = useCallback((info: Partial<ApplicantInfo>) => {
    setState(prev => ({
      ...prev,
      applicantInfo: { ...prev.applicantInfo, ...info }
    }));
  }, []);

  const value: AppContextValue = {
    ...state,
    toggleMaterialChecked,
    setMaterialCheckedList,
    isMaterialChecked,
    addOrUpdatePhoto,
    removePhoto,
    setPhotos,
    isNoticeRead,
    markNoticeRead,
    markAllNoticesRead,
    isNoticeHandled,
    markNoticeHandled,
    setApplicantInfo
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return ctx;
}
