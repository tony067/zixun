import React, { useEffect, type ReactNode } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useUserStore } from '@/stores/user';

interface AppProps {
  children: ReactNode;
}

function App(props: AppProps) {
  const { init } = useUserStore();

  useEffect(() => {
    init();
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;