import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, icon }) => {
  return (
    <View className={styles.sectionTitle}>
      <View className={styles.titleRow}>
        {icon && <Text className={styles.icon}>{icon}</Text>}
        <Text className={styles.title}>{title}</Text>
      </View>
      {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

export default SectionTitle;
