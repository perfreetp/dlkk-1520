import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import { materialCategories, agentInstructions } from '@/data/materials';

const SubmitListPage: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedBooking, setExpandedBooking] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState(false);

  const submitOrder = useMemo(() => {
    const order = [
      { category: '身份证明', items: [] as any[] },
      { category: '学历证明', items: [] as any[] },
      { category: '教师资格相关', items: [] as any[] },
      { category: '体检材料', items: [] as any[] },
      { category: '其他材料', items: [] as any[] },
      { category: '证件照片', items: [] as any[] }
    ];

    let index = 0;
    order.forEach(group => {
      const cat = materialCategories.find(c => c.name === group.category);
      if (cat) {
        cat.items.forEach(item => {
          if (item.required) {
            index++;
            group.items.push({ ...item, orderNum: index });
          }
        });
      }
    });

    return order;
  }, []);

  const totalCount = useMemo(() => {
    return submitOrder.reduce((sum, group) => sum + group.items.length, 0);
  }, [submitOrder]);

  const checkedCount = checkedItems.size;
  const allChecked = checkedCount === totalCount;

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

  const handleExport = () => {
    Taro.showLoading({ title: '生成中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showModal({
        title: '清单已生成',
        content: `共 ${totalCount} 项材料，已确认 ${checkedCount} 项。\n\n可将清单截图保存，办理时对照核对。`,
        showCancel: false,
        confirmText: '好的'
      });
    }, 1000);
    console.log('[SubmitList] export list, checked:', checkedCount, 'total:', totalCount);
  };

  const handleBooking = () => {
    Taro.showModal({
      title: '预约提示',
      content: '请前往当地教育局官网或政务服务平台进行线下受理预约。\n\n预约时请选择正确的认定机构和时间段。',
      showCancel: false,
      confirmText: '知道了'
    });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={classnames(styles.statusCard, !allChecked && styles.statusWarningCard)}>
        <View className={classnames(styles.statusIcon, !allChecked && styles.statusWarning)}>
          {allChecked ? '✅' : '📋'}
        </View>
        <View className={styles.statusContent}>
          <Text className={styles.statusTitle}>
            {allChecked ? '材料准备就绪' : '材料核对中'}
          </Text>
          <Text className={styles.statusDesc}>
            {allChecked
              ? '所有必需材料已确认，可以提交了'
              : `还有 ${totalCount - checkedCount} 项材料待确认`}
          </Text>
        </View>
      </View>

      <View className={styles.orderList}>
        <View className={styles.orderListHeader}>
          <Text className={styles.orderListTitle}>
            <Text>📑</Text> 提交顺序清单
          </Text>
          <Text className={styles.orderListCount}>
            {checkedCount}/{totalCount}
          </Text>
        </View>

        {submitOrder.map((group, groupIdx) => (
          <View key={groupIdx}>
            {groupIdx > 0 && <View style={{ height: '1rpx', background: '#f1f5f9' }} />}
            {group.items.map(item => (
              <View
                key={item.id}
                className={classnames(
                  styles.orderItem,
                  checkedItems.has(item.id) && styles.orderItemChecked
                )}
                onClick={() => toggleItem(item.id)}
              >
                <View className={styles.orderNumber}>
                  {checkedItems.has(item.id) ? '✓' : item.orderNum}
                </View>
                <View className={styles.orderInfo}>
                  <Text className={styles.orderName}>{item.name}</Text>
                  <Text className={styles.orderDesc}>{item.description}</Text>
                </View>
                <View
                  className={classnames(
                    styles.orderCheck,
                    checkedItems.has(item.id) && styles.orderItemChecked
                  )}
                >
                  {checkedItems.has(item.id) && (
                    <Text className={styles.checkIcon}>✓</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className={styles.collapseCard}>
        <View
          className={styles.collapseHeader}
          onClick={() => setExpandedBooking(!expandedBooking)}
        >
          <Text className={styles.collapseTitle}>
            <Text className={styles.collapseIcon}>🏢</Text> 线下受理预约
            <Text className={classnames(styles.badge, styles.badgeWarning)}>重要</Text>
          </Text>
          <Text
            className={classnames(
              styles.collapseChevron,
              expandedBooking && styles.collapseChevronExpanded
            )}
          >
            ▾
          </Text>
        </View>
        {expandedBooking && (
          <View className={styles.collapseBody}>
            <View className={styles.infoList}>
              <View className={styles.infoItem}>
                <View className={styles.infoDot} />
                <Text className={styles.infoText}>
                  请登录当地教育局官网或政务服务APP进行预约
                </Text>
              </View>
              <View className={styles.infoItem}>
                <View className={styles.infoDot} />
                <Text className={styles.infoText}>
                  选择对应的认定机构（一般为户籍或居住地教育局）
                </Text>
              </View>
              <View className={styles.infoItem}>
                <View className={styles.infoDot} />
                <Text className={styles.infoText}>
                  预约成功后请按时前往，迟到可能需要重新预约
                </Text>
              </View>
              <View className={styles.infoItem}>
                <View className={styles.infoDot} />
                <Text className={styles.infoText}>
                  建议提前15分钟到达，留出充足时间办理
                </Text>
              </View>
            </View>
            <View className={styles.highlightBox}>
              <Text className={styles.highlightIcon}>📌</Text>
              <Text className={styles.highlightText}>
                温馨提示：部分地区支持网上申报后直接邮寄材料，无需现场办理。请查看当地认定公告确认。
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.collapseCard}>
        <View
          className={styles.collapseHeader}
          onClick={() => setExpandedAgent(!expandedAgent)}
        >
          <Text className={styles.collapseTitle}>
            <Text className={styles.collapseIcon}>👨‍👩‍👧</Text> {agentInstructions.title}
          </Text>
          <Text
            className={classnames(
              styles.collapseChevron,
              expandedAgent && styles.collapseChevronExpanded
            )}
          >
            ▾
          </Text>
        </View>
        {expandedAgent && (
          <View className={styles.collapseBody}>
            <View className={styles.infoList}>
              {agentInstructions.requirements.map((req, idx) => (
                <View className={styles.agentRequirement} key={idx}>
                  <Text className={styles.agentReqTitle}>
                    {idx + 1}. {req.split('，')[0]}
                  </Text>
                  <Text className={styles.agentReqDesc}>
                    {req.split('，').slice(1).join('，') || req}
                  </Text>
                </View>
              ))}
            </View>
            <View className={styles.highlightBox}>
              <Text className={styles.highlightIcon}>💡</Text>
              <Text className={styles.highlightText}>
                {agentInstructions.tips}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleBooking}>
          预约指引
        </Button>
        <Button className={styles.primaryBtn} onClick={handleExport}>
          生成提交清单
        </Button>
      </View>
    </ScrollView>
  );
};

export default SubmitListPage;
