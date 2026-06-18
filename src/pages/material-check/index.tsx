import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import { materialCategories, photoSpecs } from '@/data/materials';
import SectionTitle from '@/components/SectionTitle';

const MaterialCheckPage: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(materialCategories.map(c => c.id))
  );

  const { totalCount, requiredCount, checkedCount, checkedRequiredCount } = useMemo(() => {
    let total = 0;
    let required = 0;
    let checked = 0;
    let checkedRequired = 0;

    materialCategories.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (item.required) required++;
        if (checkedItems.has(item.id)) {
          checked++;
          if (item.required) checkedRequired++;
        }
      });
    });

    return { totalCount: total, requiredCount: required, checkedCount: checked, checkedRequiredCount: checkedRequired };
  }, [checkedItems]);

  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const requiredProgress = requiredCount > 0 ? Math.round((checkedRequiredCount / requiredCount) * 100) : 0;

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const getCategoryStats = (catId: string) => {
    const category = materialCategories.find(c => c.id === catId);
    if (!category) return { checked: 0, total: 0 };
    const checked = category.items.filter(item => checkedItems.has(item.id)).length;
    return { checked, total: category.items.length };
  };

  console.log('[MaterialCheck] progress:', progress, 'checked:', checkedCount, 'total:', totalCount);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.progressCard}>
        <Text className={styles.progressTitle}>材料准备进度</Text>
        <View className={styles.progressStats}>
          <Text className={styles.progressNumber}>{checkedCount}</Text>
          <Text className={styles.progressTotal}>/ {totalCount} 项</Text>
        </View>
        <Text className={styles.progressTip}>
          必需材料已完成 {checkedRequiredCount}/{requiredCount} 项
        </Text>
        <View className={styles.progressBarBg}>
          <View className={styles.progressBarFill} style={{ width: `${progress}%` }} />
        </View>
      </View>

      <View className={styles.warningCard}>
        <Text className={styles.warningIcon}>🔍</Text>
        <View className={styles.warningContent}>
          <Text className={styles.warningTitle}>姓名与证号一致性检查</Text>
          <Text className={styles.warningDesc}>
            请确认所有材料上的姓名、身份证号完全一致。如有不一致，需提前到相关部门开具证明，以免影响认定。
          </Text>
        </View>
      </View>

      <SectionTitle title="材料清单" subtitle="点击勾选已准备好的材料" icon="📋" />

      {materialCategories.map(category => {
        const stats = getCategoryStats(category.id);
        const isExpanded = expandedCategories.has(category.id);

        return (
          <View key={category.id} className={styles.categoryCard}>
            <View className={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
              <View className={styles.categoryLeft}>
                <Text className={styles.categoryIcon}>
                  {category.id === 'identity' && '🪪'}
                  {category.id === 'education' && '🎓'}
                  {category.id === 'teacher-qual' && '📜'}
                  {category.id === 'physical' && '🏥'}
                  {category.id === 'photo' && '📷'}
                  {category.id === 'other' && '📁'}
                </Text>
                <Text className={styles.categoryName}>{category.name}</Text>
              </View>
              <View className={styles.categoryRight}>
                <Text className={styles.categoryCount}>
                  {stats.checked}/{stats.total}
                </Text>
                <Text
                  className={classnames(
                    styles.categoryChevron,
                    isExpanded && styles.categoryChevronExpanded
                  )}
                >
                  ›
                </Text>
              </View>
            </View>

            {isExpanded && (
              <View className={styles.categoryBody}>
                {category.items.map(item => (
                  <View
                    key={item.id}
                    className={classnames(
                      styles.materialItem,
                      checkedItems.has(item.id) && styles.materialChecked
                    )}
                    onClick={() => toggleItem(item.id)}
                  >
                    <View
                      className={classnames(
                        styles.checkbox,
                        checkedItems.has(item.id) && styles.checkboxChecked
                      )}
                    >
                      {checkedItems.has(item.id) && (
                        <Text className={styles.checkIcon}>✓</Text>
                      )}
                    </View>
                    <View className={styles.materialInfo}>
                      <View className={styles.materialName}>
                        <Text className={styles.materialNameText}>{item.name}</Text>
                        {item.required && (
                          <Text className={classnames(styles.tag, styles.tagRequired)}>
                            必需
                          </Text>
                        )}
                        {item.expiryCheck && (
                          <Text className={classnames(styles.tag, styles.tagExpiry)}>
                            注意有效期
                          </Text>
                        )}
                        {item.photoSpec && (
                          <Text className={classnames(styles.tag, styles.tagPhoto)}>
                            有规格要求
                          </Text>
                        )}
                      </View>
                      <Text className={styles.materialDesc}>{item.description}</Text>
                      <Text className={styles.materialTips}>💡 {item.tips}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View className={styles.tipsSection}>
        <SectionTitle title="照片规格提示" subtitle="证件照是最容易出错的环节" icon="📸" />

        <View className={styles.tipsCard}>
          <Text className={styles.tipsCardTitle}>
            <Text className={styles.tipsCardIcon}>📐</Text> 标准要求
          </Text>
          <View className={styles.photoSpecGrid}>
            <View className={styles.specItem}>
              <Text className={styles.specLabel}>尺寸</Text>
              <Text className={styles.specValue}>{photoSpecs.standard.size}</Text>
            </View>
            <View className={styles.specItem}>
              <Text className={styles.specLabel}>背景</Text>
              <Text className={styles.specValue}>{photoSpecs.standard.background}</Text>
            </View>
            <View className={styles.specItem}>
              <Text className={styles.specLabel}>格式</Text>
              <Text className={styles.specValue}>{photoSpecs.standard.format}</Text>
            </View>
            <View className={styles.specItem}>
              <Text className={styles.specLabel}>大小</Text>
              <Text className={styles.specValue}>{photoSpecs.standard.fileSize}</Text>
            </View>
          </View>
        </View>

        <View className={styles.tipsCard}>
          <Text className={styles.tipsCardTitle}>
            <Text className={styles.tipsCardIcon}>✅</Text> 拍摄要点
          </Text>
          <View className={styles.tipsList}>
            {photoSpecs.standard.requirements.map((req, idx) => (
              <View key={idx} className={styles.tipItem}>
                <View className={styles.tipDot} />
                <Text>{req}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MaterialCheckPage;
