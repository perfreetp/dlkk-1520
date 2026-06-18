import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { materialCategories, photoSpecs } from '@/data/materials';
import SectionTitle from '@/components/SectionTitle';
import { useAppStore } from '@/store/AppContext';

const MaterialCheckPage: React.FC = () => {
  const {
    materialChecked,
    toggleMaterialChecked,
    applicantInfo,
    setApplicantInfo
  } = useAppStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(materialCategories.map(c => c.id))
  );
  const [showCheckPanel, setShowCheckPanel] = useState(false);
  const [inputName, setInputName] = useState(applicantInfo.name || '');
  const [inputIdNumber, setInputIdNumber] = useState(applicantInfo.idNumber || '');
  const [isChecking, setIsChecking] = useState(false);

  const checkedItems = useMemo(() => new Set(materialChecked), [materialChecked]);

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

  const validateIdNumber = (id: string): boolean => {
    if (!id || id.length !== 18) return false;
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return reg.test(id);
  };

  const handleCheckConsistency = async () => {
    if (!inputName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!inputIdNumber.trim()) {
      Taro.showToast({ title: '请输入身份证号', icon: 'none' });
      return;
    }
    if (!validateIdNumber(inputIdNumber.trim())) {
      Taro.showToast({ title: '身份证号格式不正确', icon: 'none' });
      return;
    }

    setIsChecking(true);

    await new Promise(resolve => setTimeout(resolve, 600));

    const nameValid = inputName.trim().length >= 2;
    const idValid = validateIdNumber(inputIdNumber.trim());
    const passed = nameValid && idValid;

    setApplicantInfo({
      name: inputName.trim(),
      idNumber: inputIdNumber.trim(),
      checkPassed: passed,
      checkTime: new Date().toISOString()
    });

    setIsChecking(false);

    if (passed) {
      Taro.showModal({
        title: '✅ 一致性检查通过',
        content: '姓名和身份证号格式校验通过。\n\n请在后续整理材料时，继续核对每一份证件上的姓名与身份证号是否完全一致。',
        showCancel: false,
        confirmText: '好的'
      });
    } else {
      Taro.showModal({
        title: '⚠️ 需重点核对',
        content: '请特别留意以下材料中的姓名和身份证号：\n\n• 身份证（正反面）\n• 毕业证书\n• 教师资格考试合格证明\n• 普通话等级证书\n• 体检表\n• 思想品德鉴定表\n\n如发现不一致，请提前到相关部门开具证明。',
        showCancel: false,
        confirmText: '知道了'
      });
    }

    console.log('[MaterialCheck] consistency check:', { name: inputName, passed });
  };

  const focusMaterials = [
    { id: 'id-card-front', name: '身份证正面' },
    { id: 'id-card-back', name: '身份证反面' },
    { id: 'diploma', name: '毕业证书' },
    { id: 'exam-cert', name: '教师资格考试合格证明' },
    { id: 'mandarin-cert', name: '普通话水平测试等级证书' },
    { id: 'physical-report', name: '体检表' }
  ];

  const isFocusMaterial = (id: string) =>
    applicantInfo.checkPassed === false && focusMaterials.some(m => m.id === id);

  console.log('[MaterialCheck] progress:', progress, 'checked:', checkedCount);

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

      {applicantInfo.checkPassed !== null && applicantInfo.name ? (
        <View
          className={classnames(
            styles.warningCard,
            applicantInfo.checkPassed && styles.passCard
          )}
          onClick={() => setShowCheckPanel(!showCheckPanel)}
        >
          <Text className={styles.warningIcon}>
            {applicantInfo.checkPassed ? '✅' : '⚠️'}
          </Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>
              {applicantInfo.checkPassed ? '一致性检查已通过' : '需重点核对姓名与证号'}
            </Text>
            <Text className={styles.warningDesc}>
              {applicantInfo.checkPassed
                ? `${applicantInfo.name} · 身份证号格式已校验，记得核对每份材料上的信息是否一致`
                : `${applicantInfo.name} · 请确认所有材料上的姓名与身份证号完全一致，点击查看需重点核对的材料`}
            </Text>
          </View>
        </View>
      ) : (
        <View className={styles.warningCard} onClick={() => setShowCheckPanel(!showCheckPanel)}>
          <Text className={styles.warningIcon}>🔍</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>姓名与身份证号一致性检查</Text>
            <Text className={styles.warningDesc}>
              点击填写申请人信息，系统将提示您需要重点核对的材料（不替代正式核验）
            </Text>
          </View>
        </View>
      )}

      {showCheckPanel && (
        <View className={styles.checkPanel}>
          <Text className={styles.checkPanelTitle}>申请人信息</Text>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>姓名</Text>
            <Input
              className={styles.inputField}
              placeholder="请输入真实姓名"
              value={inputName}
              onInput={e => setInputName(e.detail.value)}
              maxlength={20}
            />
          </View>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>身份证号</Text>
            <Input
              className={styles.inputField}
              placeholder="请输入18位身份证号"
              value={inputIdNumber}
              onInput={e => setInputIdNumber(e.detail.value)}
              maxlength={18}
            />
          </View>
          <Button
            className={styles.checkBtn}
            onClick={handleCheckConsistency}
            loading={isChecking}
            disabled={isChecking}
          >
            {isChecking ? '检查中...' : '开始检查'}
          </Button>
          {applicantInfo.checkPassed === false && (
            <View className={styles.focusList}>
              <Text className={styles.focusListTitle}>🔎 请重点核对以下材料：</Text>
              {focusMaterials.map(m => (
                <Text key={m.id} className={styles.focusItem}>• {m.name}</Text>
              ))}
            </View>
          )}
        </View>
      )}

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
                      checkedItems.has(item.id) && styles.materialChecked,
                      isFocusMaterial(item.id) && styles.materialFocus
                    )}
                    onClick={() => toggleMaterialChecked(item.id)}
                  >
                    <View
                      className={classnames(
                        styles.checkbox,
                        checkedItems.has(item.id) && styles.checkboxChecked,
                        isFocusMaterial(item.id) && !checkedItems.has(item.id) && styles.checkboxFocus
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
                        {isFocusMaterial(item.id) && (
                          <Text className={classnames(styles.tag, styles.tagFocus)}>
                            重点核对
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
