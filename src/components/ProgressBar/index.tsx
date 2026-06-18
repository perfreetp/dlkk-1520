import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface ProgressBarProps {
  percent: number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  showText = false,
  size = 'md',
  color = 'primary'
}) => {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <View className={styles.progressWrap}>
      <View className={classnames(styles.track, styles[`track-${size}`])}>
        <View
          className={classnames(styles.bar, styles[`bar-${color}`], styles[`bar-${size}`])}
          style={{ width: `${safePercent}%` }}
        />
      </View>
      {showText && (
        <Text className={styles.percentText}>{safePercent}%</Text>
      )}
    </View>
  );
};

export default ProgressBar;
