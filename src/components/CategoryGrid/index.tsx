import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface Category {
  id: string;
  label: string;
  bg: string;
  color: string;
}

interface CategoryGridProps {
  categories: Category[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selectedId, onSelect }) => {
  return (
    <View className={styles.container}>
      {categories.map(item => (
        <View
          key={item.id}
          className={classnames(styles.item, selectedId === item.id && styles.active)}
          style={{ backgroundColor: item.bg }}
          onClick={() => onSelect?.(item.id)}
        >
          <Text className={styles.label} style={{ color: item.color }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default CategoryGrid;
