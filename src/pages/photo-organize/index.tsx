import React, { useState, useMemo } from 'react';
import { View, Text, Button, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { materialCategories } from '@/data/materials';
import type { PhotoItem } from '@/types';

const PhotoOrganizePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(materialCategories[0].id);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showCropGuide, setShowCropGuide] = useState(false);

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
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const newPhoto: PhotoItem = {
          id: `photo_${Date.now()}`,
          materialId: itemId,
          name: itemName,
          url: res.tempFilePaths[0],
          uploadedAt: new Date().toISOString(),
          status: 'pending'
        };

        setPhotos(prev => {
          const filtered = prev.filter(p => p.materialId !== itemId);
          return [...filtered, newPhoto];
        });

        Taro.showToast({
          title: '上传成功',
          icon: 'success'
        });

        console.log('[PhotoOrganize] photo uploaded:', itemName);
      }
    } catch (error) {
      console.error('[PhotoOrganize] take photo error:', error);
      Taro.showToast({
        title: '取消选择',
        icon: 'none'
      });
    }
  };

  const handlePreviewPhoto = (url: string) => {
    Taro.previewImage({
      urls: [url],
      current: url
    });
  };

  const handleDeletePhoto = (itemId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          setPhotos(prev => prev.filter(p => p.materialId !== itemId));
          Taro.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
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
              点击查看正确的拍照方法，确保材料清晰可辨
            </Text>
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipIcon}>⚠️</Text>
          <Text className={styles.tipText}>
            请确保照片四角完整、文字清晰，光线充足不反光。建议使用扫描类APP拍摄，效果更好。
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
                      <Image
                        className={styles.photoImage}
                        src={photo.url}
                        mode="aspectFill"
                        onClick={() => handlePreviewPhoto(photo.url)}
                      />
                      <View className={classnames(styles.statusBadge, styles.statusDone)}>
                        已上传
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
                  {uploaded ? (
                    <>
                      <View
                        className={styles.actionBtn}
                        onClick={() => photo && handlePreviewPhoto(photo.url)}
                      >
                        查看
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                        onClick={() => handleTakePhoto(item.id, item.name)}
                      >
                        重拍
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
          </View>
          <Button className={styles.cropGuideClose} onClick={() => setShowCropGuide(false)}>
            我知道了
          </Button>
        </View>
      )}
    </View>
  );
};

export default PhotoOrganizePage;
