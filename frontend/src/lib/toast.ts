import toast from 'react-hot-toast';

export const neoToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message, { icon: null }),
};

export default neoToast;
