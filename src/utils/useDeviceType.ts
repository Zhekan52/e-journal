import { useState, useEffect } from 'react';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width >= 768 && width <= 1024 && isTouchDevice) {
        setDeviceType('tablet');
      } else if (width >= 768 && width <= 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  return deviceType;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsTablet((width >= 768 && width <= 1024) || (width > 1024 && isTouchDevice && width < 1280));
    };

    checkIsTablet();
    window.addEventListener('resize', checkIsTablet);
    
    return () => window.removeEventListener('resize', checkIsTablet);
  }, []);

  return isTablet;
}
