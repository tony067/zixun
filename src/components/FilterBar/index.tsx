import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export interface FilterOption {
  key: string;
  label: string;
  options: string[];
}

interface FilterBarProps {
  filters: FilterOption[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, values, onChange }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

  return (
    <View className={styles.container}>
      <ScrollView scrollX className={styles.scrollContainer}>
        <View className={styles.filterList}>
          {filters.map(filter => {
            const isActive = values[filter.key] && values[filter.key] !== filter.options[0];
            return (
              <View
                key={filter.key}
                className={classnames(styles.filterItem, isActive && styles.active)}
                onClick={() => toggleExpand(filter.key)}
              >
                <Text className={styles.filterLabel}>
                  {values[filter.key] || filter.label}
                </Text>
                <Text className={styles.arrow}>{expandedKey === filter.key ? '▲' : '▼'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {expandedKey && (
        <View className={styles.panel}>
          {filters
            .filter(f => f.key === expandedKey)
            .map(filter => (
              <View key={filter.key} className={styles.optionsGrid}>
                {filter.options.map(option => (
                  <View
                    key={option}
                    className={classnames(
                      styles.optionItem,
                      values[filter.key] === option && styles.optionActive
                    )}
                    onClick={() => {
                      onChange(filter.key, option);
                      setExpandedKey(null);
                    }}
                  >
                    <Text className={styles.optionText}>{option}</Text>
                  </View>
                ))}
              </View>
            ))}
        </View>
      )}
    </View>
  );
};

export default FilterBar;
