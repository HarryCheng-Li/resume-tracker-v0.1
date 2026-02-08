import toast, { Toaster, ToastOptions } from 'react-hot-toast';

// 默认配置
const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-center',
};

// 封装的 toast 方法
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, duration: 4000, ...options });
  },
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
  info: (message: string, options?: ToastOptions) => {
    toast(message, {
      ...defaultOptions,
      icon: 'ℹ️',
      ...options,
    });
  },
  warning: (message: string, options?: ToastOptions) => {
    toast(message, {
      ...defaultOptions,
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
      },
      ...options,
    });
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, { ...defaultOptions, ...options });
  },
};

// 导出 Toaster 组件供 App.tsx 使用
export { Toaster };

// 导出原始 toast 以供高级用法
export { toast };
