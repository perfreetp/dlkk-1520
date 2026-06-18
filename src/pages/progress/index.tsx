import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { ProgressStep, NoticeItem } from '@/types';
import { useAppStore } from '@/store/AppContext';
import { generateExportText, saveExportToClipboard } from '@/utils/export';
import { buildPrecheckReport } from '@/utils/precheck';

const progressSteps: ProgressStep[] = [
  {
    id: 'step1',
    title: '准备材料',
    description: '收集并整理所有认定所需材料',
    status: 'completed',
    date: '已完成'
  },
  {
    id: 'step2',
    title: '网上申报',
    description: '在中国教师资格网提交申请',
    status: 'completed',
    date: '已完成'
  },
  {
    id: 'step3',
    title: '材料预检',
    description: '线上审核材料是否齐全',
    status: 'current',
    date: '进行中'
  },
  {
    id: 'step4',
    title: '现场受理',
    description: '线下提交材料原件核验',
    status: 'pending'
  },
  {
    id: 'step5',
    title: '认定通过',
    description: '领取教师资格证书',
    status: 'pending'
  }
];

const baseNotices: NoticeItem[] = [
  {
    id: 'n1',
    title: '材料补正：学历认证报告过期',
    content: '您提交的学历认证报告（学信网电子注册备案表）已过期。请重新登录学信网下载有效期内的电子注册备案表（建议选择6个月有效期），并拍照上传到学历证明分类下的「学历认证报告」材料中。',
    type: 'warning',
    date: '2024-01-15 10:30',
    read: false,
    relatedMaterialId: 'degree-report',
    relatedCategoryId: 'education',
    relatedTab: 'photo-organize',
    actionLabel: '去拍照上传'
  },
  {
    id: 'n2',
    title: '预审已通过',
    content: '您提交的材料预审已通过，请尽快预约线下受理时间，携带所有材料原件前往指定认定机构现场核验。\n\n• 身份证（正反面原件）\n• 毕业证书原件\n• 教师资格考试合格证明\n• 普通话等级证书原件\n• 体检表（近半年内有效）',
    type: 'success',
    date: '2024-01-12 14:20',
    read: false
  },
  {
    id: 'n3',
    title: '证件有效期提醒：体检表',
    content: '您的体检表将于30天后到期。体检表有效期通常为半年，请在有效期内完成认定申请。如预计可能超期，建议提前联系就近医院重新体检。',
    type: 'warning',
    date: '2024-01-10 09:00',
    read: true,
    relatedMaterialId: 'physical-exam',
    relatedCategoryId: 'physical',
    relatedTab: 'material-check',
    actionLabel: '去核对材料'
  },
  {
    id: 'n4',
    title: '申报成功通知',
    content: '您的教师资格认定申请已提交成功！请在「材料预检」页面填写申请人姓名和身份证号，核对重点材料后导出清单，等待后续预审通知。',
    type: 'info',
    date: '2024-01-08 16:45',
    read: true,
    relatedMaterialId: '',
    relatedCategoryId: '',
    relatedTab: 'material-check',
    actionLabel: '去填写信息'
  }
];

const reminders = [
  {
    id: 'r1',
    title: '体检表有效期',
    desc: '请在有效期内完成认定',
    days: 30,
    icon: '🏥',
    type: 'warning' as const,
    relatedMaterialId: 'physical-exam'
  },
  {
    id: 'r2',
    title: '考试合格证明',
    desc: '教师资格考试合格证明',
    days: 180,
    icon: '📜',
    type: 'info' as const,
    relatedMaterialId: 'teacher-exam'
  },
  {
    id: 'r3',
    title: '身份证有效期',
    desc: '二代居民身份证',
    days: 365,
    icon: '🪪',
    type: 'info' as const,
    relatedMaterialId: 'id-card-front'
  },
  {
    id: 'r4',
    title: '学历认证报告',
    desc: '学信网电子注册备案表',
    days: 15,
    icon: '🎓',
    type: 'warning' as const,
    relatedMaterialId: 'degree-report'
  }
];

type TabBarPage = '/pages/self-check/index' | '/pages/material-check/index' | '/pages/photo-organize/index' | '/pages/submit-list/index' | '/pages/progress/index';

const ProgressPage: React.FC = () => {
  const {
    materialChecked,
    photos,
    noticesRead,
    noticesHandled,
    markNoticeRead,
    markAllNoticesRead,
    markNoticeHandled,
    applicantInfo
  } = useAppStore();

  const [showExportResult, setShowExportResult] = useState(false);
  const [exportText, setExportText] = useState('');

  const notices = useMemo(() => {
    return baseNotices.map(n => {
      const read = noticesRead.includes(n.id);
      const handled = noticesHandled.includes(n.id);
      return { ...n, read, handled };
    });
  }, [noticesRead, noticesHandled]);

  const unreadCount = notices.filter(n => !n.read).length;
  const unhandledCount = notices.filter(n => !n.handled && n.relatedMaterialId).length;
  const currentStep = progressSteps.find(s => s.status === 'current') || progressSteps[0];

  useEffect(() => {
    // 自动检测处理完成：检查相关的材料是否已勾选、已上传照片
    notices.forEach(notice => {
      if (!notice.relatedMaterialId || noticesHandled.includes(notice.id)) return;
      const matChecked = materialChecked.includes(notice.relatedMaterialId);
      const hasPhoto = photos.some(p => p.materialId === notice.relatedMaterialId);
      if (matChecked && hasPhoto) {
        markNoticeHandled(notice.id);
      }
    });
  }, [materialChecked, photos, notices, noticesHandled, markNoticeHandled]);

  const handleGoAction = (notice: NoticeItem) => {
    const tabMap: Record<string, TabBarPage> = {
      'material-check': '/pages/material-check/index',
      'photo-organize': '/pages/photo-organize/index',
      'self-check': '/pages/self-check/index',
      'submit-list': '/pages/submit-list/index',
      'progress': '/pages/progress/index'
    };
    const targetTab = notice.relatedTab || 'material-check';
    const targetUrl = tabMap[targetTab] || ('/pages/' + targetTab + '/index') as TabBarPage;
    Taro.showToast({
      title: '正在跳转到' + (notice.actionLabel || '处理页面'),
      icon: 'none',
      duration: 800
    });
    setTimeout(() => {
      try {
        Taro.switchTab({ url: targetUrl as any }).catch(() => {
          Taro.navigateTo({ url: targetUrl as any }).catch(() => {});
        });
      } catch (e) {
        console.error('[Progress] navigate error:', e);
      }
    }, 800);
    console.log('[Progress] go action for notice:', notice.id, '->', targetUrl);
  };

  const handleNoticeClick = (notice: NoticeItem) => {
    if (!notice.read) {
      markNoticeRead(notice.id);
    }
    Taro.showModal({
      title: notice.title,
      content: notice.content,
      showCancel: !!notice.relatedMaterialId,
      cancelText: '先不处理',
      confirmText: notice.relatedMaterialId ? (notice.actionLabel || '去处理') : '知道了',
      success: (res) => {
        if (res.confirm && notice.relatedMaterialId) {
          handleGoAction(notice);
        }
      }
    });
    console.log('[Progress] view notice:', notice.id);
  };

  const handleMarkAllRead = () => {
    markAllNoticesRead();
    Taro.showToast({
      title: '全部已读',
      icon: 'success'
    });
  };

  const handleReminderClick = (reminder: typeof reminders[0]) => {
    const hasRelated = reminder.relatedMaterialId;
    if (!hasRelated) return;
    Taro.showActionSheet({
      itemList: ['查看该材料在材料预检中', '去拍照整理页面上传照片'],
      success: (res) => {
        const targetTab: TabBarPage = res.tapIndex === 0
          ? '/pages/material-check/index'
          : '/pages/photo-organize/index';
        Taro.switchTab({ url: targetTab as any }).catch(() => {});
      }
    });
  };

  const handleExportChoice = () => {
    Taro.showActionSheet({
      itemList: ['导出材料清单', '打包照片索引', '完整材料包'],
      success: async (res) => {
        const titles = ['教师资格认定 - 材料清单', '教师资格认定 - 照片索引', '教师资格认定 - 完整材料包'];
        const report = buildPrecheckReport(applicantInfo, materialChecked, photos);
        const precheckInfo = {
          passed: report.passed.map(p => ({ title: p.title, detail: p.detail })),
          needCheck: report.needCheck.map(p => ({ title: p.title, detail: p.detail })),
          isPassed: report.isPassed
        };
        const text = generateExportText(
          {
            materialChecked,
            submitChecked: materialChecked,
            photos,
            applicantInfo: applicantInfo.name ? applicantInfo : undefined,
            precheckInfo
          },
          titles[res.tapIndex]
        );

        setExportText(text);
        setShowExportResult(true);

        const success = await saveExportToClipboard(text);
        if (success) {
          Taro.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }

        console.log('[Progress] export generated, index:', res.tapIndex);
      }
    });
  };

  const handleCopyAgain = async () => {
    const success = await saveExportToClipboard(exportText);
    if (success) {
      Taro.showToast({
        title: '已复制',
        icon: 'success'
      });
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'warning': return styles.typeWarning;
      case 'success': return styles.typeSuccess;
      default: return styles.typeInfo;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'warning': return '提醒';
      case 'success': return '通过';
      default: return '通知';
    }
  };

  const getDaysColor = (days: number) => {
    if (days <= 30) return styles.daysWarning;
    if (days <= 90) return '';
    return styles.daysOk;
  };

  const getReminderTypeClass = (type: string) => {
    switch (type) {
      case 'warning': return styles.reminderWarning;
      case 'success': return styles.reminderSuccess;
      default: return styles.reminderInfo;
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.progressOverview}>
        <Text className={styles.overviewTitle}>当前办理进度</Text>
        <Text className={styles.overviewStage}>{currentStep.title}</Text>
        <Text className={styles.overviewDesc}>{currentStep.description}</Text>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📊</Text> 办理流程
          </Text>
        </View>
        <View className={styles.timeline}>
          {progressSteps.map(step => (
            <View
              key={step.id}
              className={classnames(
                styles.timelineItem,
                step.status === 'completed' && styles.timelineItemCompleted,
                step.status === 'current' && styles.timelineItemCurrent
              )}
            >
              <View
                className={classnames(
                  styles.timelineDot,
                  step.status === 'completed' && styles.dotCompleted,
                  step.status === 'current' && styles.dotCurrent,
                  step.status === 'pending' && styles.dotPending
                )}
              >
                {step.status === 'completed' ? '✓' : ''}
              </View>
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>{step.title}</Text>
                <Text className={styles.timelineDesc}>{step.description}</Text>
                {step.date && (
                  <Text className={styles.timelineDate}>{step.date}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🔔</Text> 消息通知
            {unreadCount > 0 && (
              <Text className={styles.unreadBadge}>
                {unreadCount}
              </Text>
            )}
            {unhandledCount > 0 && (
              <Text className={classnames(styles.unreadBadge, styles.handledBadge)}>
                {unhandledCount}待处理
              </Text>
            )}
          </Text>
          {unreadCount > 0 && (
            <Text className={styles.sectionAction} onClick={handleMarkAllRead}>
              全部已读
            </Text>
          )}
        </View>
        <View className={styles.noticeList}>
          {notices.map(notice => (
            <View
              key={notice.id}
              className={classnames(
                styles.noticeCard,
                !notice.read && styles.noticeUnread,
                notice.handled && styles.noticeHandled
              )}
              onClick={() => handleNoticeClick(notice)}
            >
              <View className={styles.noticeHeader}>
                <Text className={classnames(styles.noticeType, getTypeClass(notice.type))}>
                  {getTypeLabel(notice.type)}
                </Text>
                <Text className={styles.noticeTitle}>{notice.title}</Text>
                {!notice.read && <View className={styles.noticeUnreadDot} />}
                {notice.handled && (
                  <Text className={styles.noticeHandledTag}>✓ 已处理</Text>
                )}
              </View>
              <Text className={styles.noticeContent}>{notice.content}</Text>
              <View className={styles.noticeFooter}>
                <Text className={styles.noticeDate}>{notice.date}</Text>
                {notice.relatedMaterialId && (
                  <View className={styles.noticeActions}>
                    <Button
                      className={classnames(
                        styles.noticeActionBtn,
                        notice.handled && styles.noticeActionBtnDone
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoAction(notice);
                      }}
                    >
                      {notice.handled ? '查看处理结果' : (notice.actionLabel || '去处理')}
                    </Button>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⏰</Text> 有效期提醒
          </Text>
        </View>
        <View className={styles.reminderGrid}>
          {reminders.map(item => (
            <View
              key={item.id}
              className={styles.reminderCard}
              onClick={() => handleReminderClick(item)}
            >
              <View className={classnames(styles.reminderIcon, getReminderTypeClass(item.type))}>
                {item.icon}
              </View>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>{item.title}</Text>
                <Text className={styles.reminderDesc}>{item.desc}</Text>
              </View>
              <View className={styles.reminderDays}>
                <Text className={classnames(styles.daysNumber, getDaysColor(item.days))}>
                  {item.days}
                </Text>
                <Text className={styles.daysLabel}>天后到期</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.exportSection}>
        <View className={styles.exportCard}>
          <Text className={styles.exportIcon}>📦</Text>
          <View className={styles.exportContent}>
            <Text className={styles.exportTitle}>个人材料打包</Text>
            <Text className={styles.exportDesc}>
              一键导出整理好的材料包，含预检报告、完成度统计，方便备份和打印
            </Text>
          </View>
          <Button className={styles.exportBtn} onClick={handleExportChoice}>
            导出
          </Button>
        </View>
      </View>

      {showExportResult && (
        <View className={styles.exportModal} onClick={() => setShowExportResult(false)}>
          <View className={styles.exportModalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.exportModalHeader}>
              <Text className={styles.exportModalTitle}>材料包已生成</Text>
              <Text className={styles.exportModalClose} onClick={() => setShowExportResult(false)}>
                ✕
              </Text>
            </View>
            <ScrollView scrollY className={styles.exportModalBody}>
              <Text className={styles.exportText}>{exportText}</Text>
            </ScrollView>
            <View className={styles.exportModalActions}>
              <Button className={styles.exportModalBtnSecondary} onClick={() => setShowExportResult(false)}>
                关闭
              </Button>
              <Button className={styles.exportModalBtnPrimary} onClick={handleCopyAgain}>
                复制内容
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ProgressPage;
