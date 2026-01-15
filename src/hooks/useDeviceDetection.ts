import { useEffect, useState } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};

const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1920,
      screenHeight: 1080,
      orientation: 'landscape',
      pixelRatio: 1,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    screenWidth: width,
    screenHeight: height,
    orientation: width > height ? 'landscape' : 'portrait',
    pixelRatio: window.devicePixelRatio || 1,
  };
};

export const getOptimalImageSize = (deviceInfo: DeviceInfo): number => {
  if (deviceInfo.isMobile) return 400;
  if (deviceInfo.isTablet) return 800;
  return 1200;
};

export const getOptimalChunkSize = (deviceInfo: DeviceInfo): number => {
  if (deviceInfo.isMobile) return 10;
  if (deviceInfo.isTablet) return 20;
  return 50;
};
