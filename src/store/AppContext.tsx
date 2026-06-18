import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StorageKeys, getStorage, setStorage } from '@/utils/storage';
import type { PhotoItem, ApplicantInfo } from '@/types';

interface AppState {
  materialChecked: string[];
  submitChecked: string[];
  photos: PhotoItem[];
  noticesRead: string[];
  applicantInfo: ApplicantInfo;
}

interface AppContextValue extends AppState {
  toggleMaterialChecked: (id: string) => void;
  setMaterialCheckedList: (ids: string[]) => void;
  toggleSubmitChecked: (id: string) => void;
  setSubmitCheckedList: (ids: string[]) => void;
  addOrUpdatePhoto: (photo: PhotoItem) => void;
  removePhoto: (materialId: string) => void;
  setPhotos: (photos: PhotoItem[]) => void;
  markNoticeRead: (id: string) => void;
  markAllNoticesRead: () => void;
  setApplicantInfo: (info: Partial<ApplicantInfo>) => void;
}

const defaultApplicantInfo: ApplicantInfo = {
  name: '',
  idNumber: '',
  checkPassed: null
};

const defaultState: AppState = {
  materialChecked: [],
  submitChecked: [],
  photos: [],
  noticesRead: [],
  applicantInfo: defaultApplicantInfo
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    materialChecked: getStorage<string[]>(StorageKeys.MATERIAL_CHECKED, []),
    submitChecked: getStorage<string[]>(StorageKeys.SUBMIT_CHECKED, []),
    photos: getStorage<PhotoItem[]>(StorageKeys.PHOTOS, []),
    noticesRead: getStorage<string[]>(StorageKeys.NOTICES_READ, []),
    applicantInfo: getStorage<ApplicantInfo>(StorageKeys.APPLICANT_INFO, defaultApplicantInfo)
  }));

  useEffect(() => {
    setStorage(StorageKeys.MATERIAL_CHECKED, state.materialChecked);
  }, [state.materialChecked]);

  useEffect(() => {
    setStorage(StorageKeys.SUBMIT_CHECKED, state.submitChecked);
  }, [state.submitChecked]);

  useEffect(() => {
    setStorage(StorageKeys.PHOTOS, state.photos);
  }, [state.photos]);

  useEffect(() => {
    setStorage(StorageKeys.NOTICES_READ, state.noticesRead);
  }, [state.noticesRead]);

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

  const toggleSubmitChecked = useCallback((id: string) => {
    setState(prev => {
      const exists = prev.submitChecked.includes(id);
      return {
        ...prev,
        submitChecked: exists
          ? prev.submitChecked.filter(i => i !== id)
          : [...prev.submitChecked, id]
      };
    });
  }, []);

  const setSubmitCheckedList = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, submitChecked: ids }));
  }, []);

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

  const markNoticeRead = useCallback((id: string) => {
    setState(prev => {
      if (prev.noticesRead.includes(id)) return prev;
      return { ...prev, noticesRead: [...prev.noticesRead, id] };
    });
  }, []);

  const markAllNoticesRead = useCallback(() => {
    setState(prev => ({ ...prev, noticesRead: ['n1', 'n2', 'n3', 'n4'] }));
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
    toggleSubmitChecked,
    setSubmitCheckedList,
    addOrUpdatePhoto,
    removePhoto,
    setPhotos,
    markNoticeRead,
    markAllNoticesRead,
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
