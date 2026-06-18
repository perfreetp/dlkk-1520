import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface CheckListItemProps {
  title: string;
  description?: string;
  checked: boolean;
  required?: boolean;
  warning?: boolean;
  onClick?: () => void;
}

const CheckListItem: React.FC<CheckListItemProps> = ({
  title,
  description,
  checked,
  required = false,
  warning = false,
  onClick
}) => {
  return (
    <View
      className={classnames(
        styles.item,
        checked && styles.checked,
        warning && styles.warning,
        onClick && styles.clickable
      )}
      onClick={onClick}
    >
      <View className={classnames(styles.checkbox, checked && styles.checkboxChecked)}>
        {checked && <Text className={styles.checkIcon}>✓</Text>}
      </View>
      <View className={styles.content}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{title}</Text>
          {required && <Text className={styles.requiredTag}>必需</Text>}
          {warning && !checked && <Text className={styles.warningTag}>需注意</Text>}
        </View>
        {description && (
          <Text className={styles.description}>{description}</Text>
        )}
      </View>
    </View>
  );
};

export default CheckListItem;
