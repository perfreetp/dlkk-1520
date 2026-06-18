import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Button, Image, ScrollView, MovableArea, MovableView, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { materialCategories } from '@/data/materials';
import type { PhotoItem } from '@/types';
import { useAppStore } from '@/store/AppContext';

interface CropInfo {
  left: number;
  top: number;
  width: number;
  height: number;
}

const PhotoOrganizePage: React.FC = () => {
  const { photos, addOrUpdatePhoto, removePhoto } = useAppStore();

  const [activeCategory, setActiveCategory] = useState(materialCategories[0].id);
  const [showCropGuide, setShowCropGuide] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<{ id: string; name: string } | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [cropInfo, setCropInfo] = useState<CropInfo>({ left: 10, top: 10, width: 80, height: 80 });
  const [isDraggingCorner, setIsDraggingCorner] = useState<string | null>(null);

  const currentCategory = materialCategories.find(c => c.id === activeCategory);
  const currentItems = currentCategory?.items || [];

  const stats = useMemo(() => {
    const total = materialCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const uploaded = photos.length;
    const percent = total > 0 ? Math.round((uploaded / total) * 100) : 0;
    return { total, uploaded, percent };
  }, [photos]);

  const isItemUploaded = (itemId: string) => {
    return photos.some(p => p.materialId === itemId);
  };

  const getItemPhoto = (itemId: string) => {
    return photos.find(p => p.materialId === itemId);
  };

  const handleTakePhoto = async (itemId: string, itemName: string) => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['original'],
        sourceType: ['camera', 'album'],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setCurrentMaterial({ id: itemId, name: itemName });
        setTempPhotoUrl(res.tempFilePaths[0]);
        setCropInfo({ left: 10, top: 10, width: 80, height: 80 });
        setShowCropper(true);
        console.log('[PhotoOrganize] photo selected, opening cropper');
      }
    } catch (error) {
      console.error('[PhotoOrganize] take photo error:', error);
      Taro.showToast({
        title: '取消选择',
        icon: 'none'
      });
    }
  };

  const handleCropConfirm = () => {
    if (!currentMaterial) return;

    const newPhoto: PhotoItem = {
      id: `photo_${Date.now()}`,
      materialId: currentMaterial.id,
      name: currentMaterial.name,
      url: tempPhotoUrl,
      originalUrl: tempPhotoUrl,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
      cropInfo: {
        left: cropInfo.left,
        top: cropInfo.top,
        width: cropInfo.width,
        height: cropInfo.height
      }
    };

    addOrUpdatePhoto(newPhoto);
    setShowCropper(false);
    setTempPhotoUrl('');
    setCurrentMaterial(null);

    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    });

    console.log('[PhotoOrganize] photo cropped and saved:', currentMaterial.name);
  };

  const handleCropCancel = () => {
    Taro.showModal({
      title: '确认取消',
      content: '取消后本次裁剪不会保存，确定吗？',
      success: (res) => {
        if (res.confirm) {
          setShowCropper(false);
          setTempPhotoUrl('');
          setCurrentMaterial(null);
        }
      }
    });
  };

  const handleCropReset = () => {
    setCropInfo({ left: 10, top: 10, width: 80, height: 80 });
  };

  const handlePreviewPhoto = (photo: PhotoItem) => {
    setPreviewPhoto(photo);
    setShowPreview(true);
  };

  const handleViewOriginal = () => {
    if (!previewPhoto) return;
    const originalUrl = previewPhoto.originalUrl || previewPhoto.url;
    Taro.previewImage({
      urls: [originalUrl],
      current: originalUrl
    });
  };

  const handleDeletePhoto = (itemId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          removePhoto(itemId);
          Taro.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  };

  const handleEditCrop = (itemId: string, itemName: string) => {
    const photo = getItemPhoto(itemId);
    if (!photo) return;
    setCurrentMaterial({ id: itemId, name: itemName });
    setTempPhotoUrl(photo.originalUrl || photo.url);
    setCropInfo(photo.cropInfo || { left: 10, top: 10, width: 80, height: 80 });
    setShowCropper(true);
  };

  const handleCornerMove = (corner: string, direction: { x: number; y: number }) => {
    setCropInfo(prev => {
      let { left, top, width, height } = prev;
      const step = 2;

      switch (corner) {
        case 'topLeft':
          left = Math.max(0, Math.min(left + direction.x * step, left + width - 20));
          top = Math.max(0, Math.min(top + direction.y * step, top + height - 20));
          width = Math.max(20, prev.left + prev.width - left);
          height = Math.max(20, prev.top + prev.height - top);
          break;
        case 'topRight':
          top = Math.max(0, Math.min(top + direction.y * step, top + height - 20));
          width = Math.max(20, Math.min(100 - left, width + direction.x * step));
          height = Math.max(20, prev.top + prev.height - top);
          break;
        case 'bottomLeft':
          left = Math.max(0, Math.min(left + direction.x * step, left + width - 20));
          width = Math.max(20, prev.left + prev.width - left);
          height = Math.max(20, Math.min(100 - top, height + direction.y * step));
          break;
        case 'bottomRight':
          width = Math.max(20, Math.min(100 - left, width + direction.x * step));
          height = Math.max(20, Math.min(100 - top, height + direction.y * step));
          break;
      }

      return { left, top, width, height };
    });
  };

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    materialCategories.forEach(cat => {
      const count = cat.items.filter(item => isItemUploaded(item.id)).length;
      map[cat.id] = count;
    });
    return map;
  }, [photos]);

  const renderCroppedImage = (photo: PhotoItem, className?: string) => {
    if (!photo.cropInfo) {
      return (
        <Image
          className={className || ''}
          src={photo.url}
          mode="aspectFill"
        />
      );
    }

    const { left, top, width, height } = photo.cropInfo;
    const scaleX = 100 / width;
    const scaleY = 100 / height;
    const translateX = -left * scaleX;
    const translateY = -top * scaleY;

    return (
      <View className={styles.croppedImageWrap}>
        <Image
          className={styles.croppedImage}
          src={photo.originalUrl || photo.url}
          mode="aspectFill"
          style={{
            width: `${scaleX * 100}%`,
            height: `${scaleY * 100}%`,
            transform: `translate(${translateX}%, ${translateY}%)`,
            transformOrigin: '0 0'
          }}
        />
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.categoryTabs} showScrollbar={false}>
        {materialCategories.map(cat => (
          <View
            key={cat.id}
            className={classnames(
              styles.tabItem,
              activeCategory === cat.id && styles.tabItemActive
            )}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name} ({categoryStats[cat.id]}/{cat.items.length})
          </View>
        ))}
      </ScrollView>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.statsCard}>
          <Text className={styles.statsTitle}>
            <Text>📊</Text> 拍照进度
          </Text>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.uploaded}</Text>
              <Text className={styles.statLabel}>已上传</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.total - stats.uploaded}</Text>
              <Text className={styles.statLabel}>待拍摄</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statNumber}>{stats.percent}%</Text>
              <Text className={styles.statLabel}>完成率</Text>
            </View>
          </View>
        </View>

        <View className={styles.guideCard} onClick={() => setShowCropGuide(true)}>
          <Text className={styles.guideIcon}>💡</Text>
          <View className={styles.guideContent}>
            <Text className={styles.guideTitle}>拍照小技巧</Text>
            <Text className={styles.guideTips}>
              点击查看正确的拍照方法，上传后可裁剪调整
            </Text>
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipIcon}>✂️</Text>
          <Text className={styles.tipText}>
            上传照片后可拖动四角调整裁剪范围，确保材料边缘对齐。
          </Text>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>{currentCategory?.name}</Text>
          <Text className={styles.sectionCount}>
            {categoryStats[activeCategory]}/{currentItems.length} 项
          </Text>
        </View>

        <View className={styles.photoGrid}>
          {currentItems.map(item => {
            const photo = getItemPhoto(item.id);
            const uploaded = !!photo;

            return (
              <View key={item.id} className={styles.photoCard}>
                <View className={styles.photoThumb}>
                  {uploaded && photo ? (
                    <>
                      {renderCroppedImage(photo, styles.photoImage)}
                      <View className={classnames(styles.statusBadge, styles.statusDone)}>
                        {photo.cropInfo ? '已裁剪' : '已上传'}
                      </View>
                    </>
                  ) : (
                    <>
                      <View className={styles.photoPlaceholder}>
                        <Text className={styles.placeholderIcon}>📷</Text>
                        <Text className={styles.placeholderText}>未拍摄</Text>
                      </View>
                      <View className={classnames(styles.statusBadge, styles.statusPending)}>
                        待上传
                      </View>
                    </>
                  )}
                </View>
                <View className={styles.photoInfo}>
                  <Text className={styles.photoName}>{item.name}</Text>
                  <Text className={styles.photoDesc}>{item.description}</Text>
                </View>
                <View className={styles.photoActions}>
                  {uploaded && photo ? (
                    <>
                      <View
                        className={styles.actionBtn}
                        onClick={() => handlePreviewPhoto(photo)}
                      >
                        查看
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                        onClick={() => handleEditCrop(item.id, item.name)}
                      >
                        裁剪
                      </View>
                      <View
                        className={styles.actionBtn}
                        style={{ color: '#ef4444' }}
                        onClick={() => handleDeletePhoto(item.id)}
                      >
                        删除
                      </View>
                    </>
                  ) : (
                    <View
                      className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                      onClick={() => handleTakePhoto(item.id, item.name)}
                    >
                      去拍照
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {showCropGuide && (
        <View className={styles.cropGuideModal} onClick={() => setShowCropGuide(false)}>
          <Text className={styles.cropGuideTitle}>正确拍照方式</Text>
          <View className={styles.cropGuideFrame}>
            <View className={classnames(styles.cropGuideCorner, 'topLeft')} />
            <View className={classnames(styles.cropGuideCorner, 'topRight')} />
            <View className={classnames(styles.cropGuideCorner, 'bottomLeft')} />
            <View className={classnames(styles.cropGuideCorner, 'bottomRight')} />
          </View>
          <View className={styles.cropGuideTips}>
            <Text>📐 将材料四个角对准框内</Text>
            <Text>💡 光线充足，避免反光和阴影</Text>
            <Text>📱 手机与材料保持平行</Text>
            <Text>🔍 确保文字清晰可辨认</Text>
            <Text>✂️ 上传后可继续裁剪调整</Text>
          </View>
          <Button className={styles.cropGuideClose} onClick={() => setShowCropGuide(false)}>
            我知道了
          </Button>
        </View>
      )}

      {showCropper && tempPhotoUrl && (
        <View className={styles.cropperModal}>
          <View className={styles.cropperHeader}>
            <Text className={styles.cropperTitle}>裁剪调整</Text>
            <Text className={styles.cropperSubtitle}>拖动四角调整裁剪范围</Text>
          </View>

          <View className={styles.cropperContainer}>
            <View className={styles.cropperImageWrap}>
              <Image
                className={styles.cropperImage}
                src={tempPhotoUrl}
                mode="aspectFit"
              />
              <View
                className={styles.cropBox}
                style={{
                  left: `${cropInfo.left}%`,
                  top: `${cropInfo.top}%`,
                  width: `${cropInfo.width}%`,
                  height: `${cropInfo.height}%`
                }}
              >
                <View
                  className={classnames(styles.cropCorner, styles.cropCornerTL)}
                  onClick={() => {}}
                  onTouchStart={() => setIsDraggingCorner('topLeft')}
                  onTouchEnd={() => setIsDraggingCorner(null)}
                />
                <View
                  className={classnames(styles.cropCorner, styles.cropCornerTR)}
                  onTouchStart={() => setIsDraggingCorner('topRight')}
                  onTouchEnd={() => setIsDraggingCorner(null)}
                />
                <View
                  className={classnames(styles.cropCorner, styles.cropCornerBL)}
                  onTouchStart={() => setIsDraggingCorner('bottomLeft')}
                  onTouchEnd={() => setIsDraggingCorner(null)}
                />
                <View
                  className={classnames(styles.cropCorner, styles.cropCornerBR)}
                  onTouchStart={() => setIsDraggingCorner('bottomRight')}
                  onTouchEnd={() => setIsDraggingCorner(null)}
                />
                <View className={styles.cropGridH} />
                <View className={styles.cropGridV} />
              </View>
            </View>
          </View>

          <View className={styles.cropControls}>
            <View className={styles.cropControlRow}>
              <Text className={styles.cropControlLabel}>位置微调</Text>
            </View>
            <View className={styles.cropPad}>
              <View className={styles.cropPadRow}>
                <View className={styles.cropPadBtn} onClick={() => handleCornerMove('topLeft', { x: -1, y: -1 })}>↖</View>
                <View className={styles.cropPadBtn} onClick={() => {
                  setCropInfo(p => ({ ...p, top: Math.max(0, p.top - 2) }));
                }}>↑</View>
                <View className={styles.cropPadBtn} onClick={() => handleCornerMove('topRight', { x: 1, y: -1 })}>↗</View>
              </View>
              <View className={styles.cropPadRow}>
                <View className={styles.cropPadBtn} onClick={() => {
                  setCropInfo(p => ({ ...p, left: Math.max(0, p.left - 2) }));
                }}>←</View>
                <View className={styles.cropPadCenter}>
                  <Text className={styles.cropSizeText}>
                    {Math.round(cropInfo.width)}% × {Math.round(cropInfo.height)}%
                  </Text>
                </View>
                <View className={styles.cropPadBtn} onClick={() => {
                  setCropInfo(p => ({ ...p, left: Math.min(100 - p.width, p.left + 2) }));
                }}>→</View>
              </View>
              <View className={styles.cropPadRow}>
                <View className={styles.cropPadBtn} onClick={() => handleCornerMove('bottomLeft', { x: -1, y: 1 })}>↙</View>
                <View className={styles.cropPadBtn} onClick={() => {
                  setCropInfo(p => ({ ...p, top: Math.min(100 - p.height, p.top + 2) }));
                }}>↓</View>
                <View className={styles.cropPadBtn} onClick={() => handleCornerMove('bottomRight', { x: 1, y: 1 })}>↘</View>
              </View>
            </View>
          </View>

          <View className={styles.cropperActions}>
            <Button className={styles.cropperBtnSecondary} onClick={handleCropReset}>
              重置
            </Button>
            <Button className={styles.cropperBtnSecondary} onClick={handleCropCancel}>
              取消
            </Button>
            <Button className={styles.cropperBtnPrimary} onClick={handleCropConfirm}>
              保存裁剪
            </Button>
          </View>
        </View>
      )}

      {showPreview && previewPhoto && (
        <View className={styles.previewModal} onClick={() => setShowPreview(false)}>
          <View className={styles.previewModalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.previewHeader}>
              <Text className={styles.previewTitle}>
                {previewPhoto.name}
                {previewPhoto.cropInfo && <Text className={styles.previewCroppedTag}>（已裁剪）</Text>}
              </Text>
              <Text className={styles.previewClose} onClick={() => setShowPreview(false)}>✕</Text>
            </View>
            <View className={styles.previewBody}>
              {renderCroppedImage(previewPhoto, styles.previewImage)}
            </View>
            <View className={styles.previewActions}>
              <Button className={styles.previewBtnSecondary} onClick={handleViewOriginal}>
                查看原图
              </Button>
              <Button className={styles.previewBtnPrimary} onClick={() => setShowPreview(false)}>
                关闭
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PhotoOrganizePage;
