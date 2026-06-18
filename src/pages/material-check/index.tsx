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
    setApplicantInfo,
    photos
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

  const validateIdNumber = (id: string): { valid: boolean; error?: string } => {
    if (!id) return { valid: false, error: '未填写' };
    if (id.length !== 18) return { valid: false, error: '应为18位' };
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    if (!reg.test(id)) return { valid: false, error: '格式不正确' };
    return { valid: true };
  };

  const focusMaterials = [
    { id: 'id-card-front', name: '身份证正面', category: 'identity', desc: '核对头像、姓名、身份证号是否一致' },
    { id: 'id-card-back', name: '身份证反面', category: 'identity', desc: '核对有效期是否过期' },
    { id: 'diploma', name: '毕业证书', category: 'education', desc: '核对姓名、证号、专业信息' },
    { id: 'exam-cert', name: '教师资格考试合格证明', category: 'teacher-qual', desc: '核对姓名、身份证号、照片' },
    { id: 'mandarin-cert', name: '普通话水平测试等级证书', category: 'teacher-qual', desc: '核对姓名、身份证号、照片' },
    { id: 'physical-report', name: '教师资格认定体检表', category: 'physical', desc: '核对姓名、体检结论、盖章' }
  ];

  const isFocusMaterial = (id: string) =>
    applicantInfo.checkPassed === false && focusMaterials.some(m => m.id === id);

  // 预审报告：通过项和需核对项
  const preCheckReport = useMemo(() => {
    if (applicantInfo.checkPassed === null || !applicantInfo.name) return null;

    const passItems: { title: string; detail: string }[] = [];
    const checkItems: { title: string; detail: string; materialId: string }[] = [];

    // 姓名
    if (inputName.trim().length >= 2) {
      passItems.push({
        title: '姓名格式',
        detail: `姓名 ${applicantInfo.name} 格式正常`
      });
    } else {
      checkItems.push({
        title: '姓名需核对',
        detail: '姓名长度应不少于2个字符',
        materialId: ''
      });
    }

    // 身份证
    const idCheck = validateIdNumber(inputIdNumber.trim());
    if (idCheck.valid) {
      passItems.push({
        title: '身份证格式',
        detail: `18位身份证号格式校验通过`
      });
    } else {
      checkItems.push({
        title: `身份证${idCheck.error}`,
        detail: '请输入正确的18位二代身份证号码，末位可为X',
        materialId: 'id-card-front'
      });
    }

    // 照片完成情况
    const requiredPhotos = focusMaterials.filter(m => photos.some(p => p.materialId === m.id));
    const missingPhotos = focusMaterials.filter(m => !photos.some(p => p.materialId === m.id));

    requiredPhotos.forEach(m => {
      passItems.push({
        title: `${m.name} · 已上传`,
        detail: '照片已上传，可在拍照整理中查看'
      });
    });

    missingPhotos.forEach(m => {
      checkItems.push({
        title: `${m.name} · 待准备`,
        detail: m.desc,
        materialId: m.id
      });
    });

    // 重点材料勾选情况
    focusMaterials.forEach(m => {
      const isChecked = checkedItems.has(m.id);
      if (isChecked) {
        passItems.push({
          title: `${m.name} · 已核对`,
          detail: '已在材料清单中勾选确认'
        });
      } else {
        checkItems.push({
          title: `${m.name} · 待核对`,
          detail: `请确认姓名与身份证号信息一致后勾选`,
          materialId: m.id
        });
      }
    });

    // 去重
    const uniqueCheck = checkItems.filter(
      (item, idx, arr) => arr.findIndex(i => i.title === item.title) === idx
    );

    return {
      passed: passItems,
      needCheck: uniqueCheck,
      isPassed: uniqueCheck.length === 0 && idCheck.valid
    };
  }, [applicantInfo, inputName, inputIdNumber, photos, checkedItems]);

  const handleCheckConsistency = async () => {
    if (!inputName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!inputIdNumber.trim()) {
      Taro.showToast({ title: '请输入身份证号', icon: 'none' });
      return;
    }

    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const nameValid = inputName.trim().length >= 2;
    const idCheck = validateIdNumber(inputIdNumber.trim());
    // 身份证不规范时也进入需核对状态（checkPassed=false），不是阻断流程
    const passed = nameValid && idCheck.valid;

    setApplicantInfo({
      name: inputName.trim(),
      idNumber: inputIdNumber.trim(),
      checkPassed: passed,
      checkTime: new Date().toISOString()
    });

    setIsChecking(false);
    setShowCheckPanel(true);

    console.log('[MaterialCheck] consistency check:', {
      name: inputName,
      idValid: idCheck.valid,
      passed
    });
  };

  const handleJumpToFocus = (materialId: string) => {
    if (!materialId) return;
    const target = focusMaterials.find(m => m.id === materialId);
    if (!target) return;
    const cat = materialCategories.find(c => c.id === target.category);
    if (cat) {
      setExpandedCategories(prev => new Set([...prev, cat.id]));
      // 滚动到对应位置用 setTimeout 模拟
      setTimeout(() => {
        Taro.pageScrollTo && Taro.pageScrollTo({
          selector: `#mat-item-${materialId}`,
          duration: 300
        });
      }, 100);
    }
  };

  const handleJumpToPhoto = (materialId: string) => {
    // 跳到拍照整理 tab（通过切换到下一个页面，这里只做提示）
    Taro.showActionSheet({
      itemList: ['去拍照整理上传照片', '去查看拍照整理'],
      success: () => {
        Taro.switchTab && Taro.switchTab({
          url: '/pages/photo-organize/index'
        }).catch(() => {
          console.log('[MaterialCheck] switchTab: 请手动切换到拍照整理');
        });
      }
    });
  };

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

      {/* 预审报告汇总卡 */}
      {preCheckReport ? (
        <View
          className={classnames(
            styles.reportCard,
            preCheckReport.isPassed && styles.reportCardPassed
          )}
          onClick={() => setShowCheckPanel(!showCheckPanel)}
        >
          <View className={styles.reportHeader}>
            <Text className={styles.reportIcon}>
              {preCheckReport.isPassed ? '✅' : '📋'}
            </Text>
            <View className={styles.reportHeaderInfo}>
              <Text className={styles.reportTitle}>
                {preCheckReport.isPassed ? '预审报告 · 全部通过' : '预审报告 · 需核对项待处理'}
              </Text>
              <Text className={styles.reportSubtitle}>
                {applicantInfo.name} · {applicantInfo.checkTime
                  ? new Date(applicantInfo.checkTime).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '刚刚生成'}
              </Text>
            </View>
          </View>

          <View className={styles.reportSummary}>
            <View className={styles.summaryBox}>
              <Text className={styles.summaryNumber}>{preCheckReport.passed.length}</Text>
              <Text className={styles.summaryLabel}>✅ 通过项</Text>
            </View>
            <View className={styles.summaryDivider} />
            <View className={styles.summaryBox}>
              <Text
                className={classnames(
                  styles.summaryNumber,
                  !preCheckReport.isPassed && styles.summaryNumberError
                )}
              >
                {preCheckReport.needCheck.length}
              </Text>
              <Text className={styles.summaryLabel}>⚠️ 需核对项</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className={styles.warningCard} onClick={() => setShowCheckPanel(!showCheckPanel)}>
          <Text className={styles.warningIcon}>🔍</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>姓名与身份证号一致性检查</Text>
            <Text className={styles.warningDesc}>
              点击填写申请人信息，生成预审报告（不替代正式核验）
            </Text>
          </View>
        </View>
      )}

      {/* 检查面板 */}
      {showCheckPanel && (
        <View className={styles.checkPanel}>
          <Text className={styles.checkPanelTitle}>申请人信息</Text>
          <View className={styles.inputRow}>
            <Text className={styles.inputLabel}>姓名</Text>
            <Input
              className={styles.inputField}
              placeholder="请输入真实姓名（2个字符以上）"
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
            {isChecking ? '生成报告中...' : '生成预审报告'}
          </Button>

          {/* 通过项列表 */}
          {preCheckReport && preCheckReport.passed.length > 0 && (
            <View className={styles.passList}>
              <Text className={styles.passListTitle}>
                ✅ 通过项（{preCheckReport.passed.length}）
              </Text>
              {preCheckReport.passed.map((item, idx) => (
                <View key={'p' + idx} className={styles.passItem}>
                  <View className={styles.passDot} />
                  <View style={{ flex: 1 }}>
                    <Text className={styles.passItemTitle}>{item.title}</Text>
                    <Text className={styles.passItemDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 需核对项列表 + 可操作的重点材料 */}
          {preCheckReport && preCheckReport.needCheck.length > 0 && (
            <View className={styles.focusList}>
              <Text className={styles.focusListTitle}>
                ⚠️ 需核对项（{preCheckReport.needCheck.length}）
              </Text>
              {preCheckReport.needCheck.map((item, idx) => (
                <View key={'c' + idx} className={styles.focusItemRow}>
                  <View className={styles.focusItemRowLeft}>
                    <Text className={styles.focusItemMark}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text className={styles.focusItemTitle}>{item.title}</Text>
                      <Text className={styles.focusItemDetail}>{item.detail}</Text>
                    </View>
                  </View>
                  {item.materialId && (
                    <View className={styles.focusItemActions}>
                      <View
                        className={styles.focusActionBtn}
                        onClick={() => handleJumpToFocus(item.materialId)}
                      >
                        定位
                      </View>
                      {!photos.some(p => p.materialId === item.materialId) && (
                        <View
                          className={classnames(
                            styles.focusActionBtn,
                            styles.focusActionBtnPrimary
                          )}
                          onClick={() => handleJumpToPhoto(item.materialId)}
                        >
                          拍照
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 重点材料卡片 - 逐项核对 */}
          {applicantInfo.checkPassed === false && (
            <View className={styles.focusMaterialPanel}>
              <Text className={styles.focusPanelTitle}>
                🔎 重点材料核对清单（逐项确认后勾选）
              </Text>
              {focusMaterials.map(m => {
                const isChecked = checkedItems.has(m.id);
                const hasPhoto = photos.some(p => p.materialId === m.id);
                return (
                  <View
                    key={m.id}
                    id={`mat-item-${m.id}`}
                    className={classnames(
                      styles.focusMatCard,
                      isChecked && styles.focusMatCardDone
                    )}
                    onClick={() => toggleMaterialChecked(m.id)}
                  >
                    <View
                      className={classnames(
                        styles.focusMatCheck,
                        isChecked && styles.focusMatCheckDone
                      )}
                    >
                      {isChecked && '✓'}
                    </View>
                    <View className={styles.focusMatInfo}>
                      <View className={styles.focusMatRow}>
                        <Text className={styles.focusMatName}>{m.name}</Text>
                        {hasPhoto && (
                          <View className={styles.focusMatTag}>📷 已有照片</View>
                        )}
                      </View>
                      <Text className={styles.focusMatDesc}>{m.desc}</Text>
                    </View>
                  </View>
                );
              })}
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
                    id={`mat-item-${item.id}`}
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
                        {photos.some(p => p.materialId === item.id) && (
                          <Text className={classnames(styles.tag, styles.tagPhoto)}>
                            有照片
                          </Text>
                        )}
                        {item.expiryCheck && (
                          <Text className={classnames(styles.tag, styles.tagExpiry)}>
                            注意有效期
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
